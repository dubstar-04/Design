import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw?version=1';
import Cairo from 'cairo';

import {Core} from '../Design-Core/core/core/core.js';

export const Canvas = GObject.registerClass({
  GTypeName: 'Canvas',
  Properties: {
    'file-path': GObject.ParamSpec.string(
        'file-path',
        'File Path',
        'File path for current file',
        GObject.ParamFlags.READWRITE,
        null,
    ),
  },
  Signals: {
    'commandline-updated': {param_types: [GObject.TYPE_STRING]},
    'mouseposition-updated': {param_types: [GObject.TYPE_STRING]},
    'selection-updated': {},
    'input-changed': {param_types: [GObject.TYPE_BOOLEAN]},
  },
}, class Canvas extends Gtk.DrawingArea {
  constructor(commandLine) {
    super();

    // set the drawing area as focusable or we don't get events
    this.focusable = true;

    this.commandLine = commandLine;

    const motionEvent = Gtk.EventControllerMotion.new();
    motionEvent.connect('motion', this.mouseMove.bind(this));
    this.add_controller(motionEvent);

    const clickGesture = Gtk.GestureClick.new();
    clickGesture.set_propagation_phase(Gtk.PropagationPhase.CAPTURE);
    clickGesture.set_button(0);
    // clickGesture.set_exclusive(true); <-- doesn't appear to work
    clickGesture.connect('pressed', this.mouseDown.bind(this));
    clickGesture.connect('released', this.mouseUp.bind(this));
    this.add_controller(clickGesture);

    const scrollEvent = Gtk.EventControllerScroll.new(Gtk.EventControllerScrollFlags.VERTICAL);
    scrollEvent.connect('scroll', this.wheel.bind(this));
    this.add_controller(scrollEvent);

    const zoomGesture = Gtk.GestureZoom.new();
    zoomGesture.set_propagation_phase(Gtk.PropagationPhase.BUBBLE);
    zoomGesture.connect('begin', this.zoomBegin.bind(this));
    zoomGesture.connect('scale-changed', this.zoomChanged.bind(this));
    this.add_controller(zoomGesture);

    const dragGesture = Gtk.GestureDrag.new();
    dragGesture.set_propagation_phase(Gtk.PropagationPhase.BUBBLE);
    // set button: 1 = left, 2 = wheel, 3 = right;
    // dragGesture.set_button(0);
    dragGesture.set_touch_only(true);
    dragGesture.connect('drag-begin', this.dragBegin.bind(this));
    dragGesture.connect('drag-update', this.dragUpdate.bind(this));
    dragGesture.connect('drag-end', this.dragEnd.bind(this));
    this.add_controller(dragGesture);

    const keyController = Gtk.EventControllerKey.new();
    keyController.connect('key-pressed', this.onKeyPress.bind(this));
    this.add_controller(keyController);

    const shortcutController = new Gtk.ShortcutController();

    const copyShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>C'), action: Gtk.CallbackAction.new(this.onCopy.bind(this))});
    shortcutController.add_shortcut(copyShortcut);

    const pasteShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>V'), action: Gtk.CallbackAction.new(this.onPaste.bind(this))});
    shortcutController.add_shortcut(pasteShortcut);

    const undoShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>Z'), action: Gtk.CallbackAction.new(this.onUndo.bind(this))});
    shortcutController.add_shortcut(undoShortcut);

    const cutShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>X'), action: Gtk.CallbackAction.new(this.onCut.bind(this))});
    shortcutController.add_shortcut(cutShortcut);

    this.add_controller(shortcutController);

    // create and activate a design core
    this.core = new Core();

    this.styleManager = Adw.StyleManager.get_default();
    this.styleManager.connect('notify::dark', this.onStyleChange.bind(this));

    this.set_draw_func(this.onDraw.bind(this));

    this.core.commandLine.setUpdateFunction(this.commandLineUpdateCallback.bind(this));
    this.core.canvas.setExternalPaintCallbackFunction(this.paintingCallback.bind(this));
    this.core.propertyManager.setPropertyCallbackFunction(this.propertyCallback.bind(this));

    this.grab_focus();
    this.onStyleChange();

    // set the cursor style
    this.set_cursor(Gdk.Cursor.new_from_name('crosshair', null));

    // pinch to zoom delta
    this.pinchDelta = 0;

    // activate the core
    this.activate();
  }

  setFilePath(filePath) {
    // TODO: Check path is valid
    this.file_path = filePath;
  }

  getFilePath() {
    return this.file_path;
  }

  onCopy() {
    // TODO: implement copy
    this.core.notify('Copy not implemented');
  }

  onPaste() {
    // TODO: implement paste
    this.core.notify('Paste not implemented');
  }

  onUndo() {
    // TODO: implement undo
    this.core.notify('Undo not implemented');
  }

  onCut() {
    // TODO: implement cut
    this.core.notify('Cut not implemented');
  }

  activate() {
    // activate the core
    // Core uses static methods to access the current core context
    // if this is not set changes to one tab may affect other tabs

    // Must be called on tab changes
    this.core.activate();
  }

  onStyleChange() {
    if (this.styleManager.get_dark()) {
      this.core.settings.canvasbackgroundcolour = {r: 30, g: 30, b: 30};
    } else {
      this.core.settings.canvasbackgroundcolour = {r: 246, g: 245, b: 244};
    }
    this.queue_draw();
  }

  paintingCallback() {
    this.queue_draw();
  }

  propertyCallback() {
    // console.log("Canvas - Property Callback")
    this.emit('selection-updated');
  }

  onDraw(area, cr, width, height) {
    // this is the main drawing function for the canvas
    // this is triggered by design core calling the paintingCallback()

    // set the line cap - this is required to make dotted lines work
    cr.setLineCap(Cairo.LineCap.SQUARE);
    this.core.canvas.paint(cr, width, height);
    cr.$dispose();
  }

  commandLineUpdateCallback(commandLineValue) {
    this.emit('commandline-updated', commandLineValue);
  }

  onKeyPress(controller, keyval, keycode, state) {
    // forward key press info to the commandline object
    // unless a modifier key is pressed CTRL, TAB, CAPSLOCK

    const event = controller.get_current_event();

    // Don't handle shortcuts and accelerators
    if (state & Gdk.ModifierType.CONTROL_MASK) {
      // https://docs.gtk.org/gdk4/flags.ModifierType.html
      return;
    }

    if (event.is_modifier()) {
      return;
    }

    this.commandLine.keyPressed(keyval, keycode);
  }

  mouseMove(controller, x, y) {
    this.core.mouse.mouseMoved(x, y);
    this.emit('mouseposition-updated', this.core.mouse.positionString());

    // emit input changed so the window can hide / show widgets
    // TODO: investigate if this has any performance implications
    this.emit('input-changed', true);
  }

  mouseDown(gesture, num, x, y, z) {
    const event = gesture.get_current_event();
    if (event.get_device().get_source() === Gdk.InputSource.TOUCHSCREEN) {
      // emit input changed so the window can hide / show widgets
      this.emit('input-changed', false);
      return;
    }

    const btn = gesture.get_current_button() - 1;
    this.core.mouse.mouseDown(btn);

    // ensure the canvas has focus to receive events
    this.grab_focus();
  }

  mouseUp(gesture, num, x, y, z) {
    const event = gesture.get_current_event();
    // ignore touch events
    if (event.get_device().get_source() === Gdk.InputSource.TOUCHSCREEN) {
      return;
    }

    const btn = gesture.get_current_button() - 1;
    this.core.mouse.mouseUp(btn);
  }

  wheel(controller, x, y) {
    // console.log("wheel", controller, x, y);
    this.core.mouse.wheel(y * -1);
    this.queue_draw();
  }

  dragBegin(gesture, x, y) {
    // log("dragBegin", gesture, x, y);
    // button - 0 = left, 1 = wheel, 2 = right;
    this.core.mouse.mouseMoved(x, y);
    this.core.mouse.mouseDown(1);
  }

  dragUpdate(gesture, x, y) {
    const startPoint = gesture.get_start_point();
    this.core.mouse.mouseMoved(startPoint[1] + x, startPoint[2] + y);
  }

  dragEnd(gesture, x, y) {
    // log("dragEnd", gesture, x, y);
    // button - 0 = left, 1 = wheel, 2 = right;
    this.core.mouse.mouseUp(1);
  }

  zoomBegin(gesture, data) {
    // console.log("zoomBegin", gesture, data);
    // get the pinch center from the bound box
    const boundBox = gesture.get_bounding_box_center();
    this.core.mouse.mouseMoved(boundBox[1], boundBox[2]);
    // pinch to zoom delta
    this.pinchDelta = 0;
  }

  zoomChanged(gesture, scale) {
    // console.log("zoomChanged", gesture, scale);
    const scaleDelta = scale - this.pinchDelta;

    // ignore the first zoom change because we need
    // the delta between the current and previous
    if (this.pinchDelta !== 0) {
      this.core.mouse.wheel(scaleDelta);
    }
    this.pinchDelta = scale;
  }
});
