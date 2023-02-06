import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw?version=1';

import {Core} from '../Design-Core/core/core.js';

export const Canvas = GObject.registerClass({
  GTypeName: 'Canvas',
  Properties: {},
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
    keyController.connect('key-pressed', this.on_key_press.bind(this));
    this.add_controller(keyController);

    const shortcutController = new Gtk.ShortcutController();

    const copyShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>C'), action: Gtk.CallbackAction.new(this.on_copy.bind(this))});
    shortcutController.add_shortcut(copyShortcut);

    const pasteShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>V'), action: Gtk.CallbackAction.new(this.on_paste.bind(this))});
    shortcutController.add_shortcut(pasteShortcut);

    const undoShortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>Z'), action: Gtk.CallbackAction.new(this.on_undo.bind(this))});
    shortcutController.add_shortcut(undoShortcut);

    this.add_controller(shortcutController);

    this.core = new Core();

    this.styleManager = Adw.StyleManager.get_default();
    this.styleManager.connect('notify::dark', this.on_style_change.bind(this));

    this.core.canvas.setCanvasWidget(this._drawingArea, this.ctx);
    this.set_draw_func(this.on_draw.bind(this));

    this.core.commandLine.setUpdateFunction(this.commandLineUpdateCallback.bind(this));
    this.core.canvas.setExternalPaintCallbackFunction(this.painting_callback.bind(this));
    this.core.propertyManager.setPropertyCallbackFunction(this.propertyCallback.bind(this));

    this.grab_focus();
    this.on_style_change();

    // set the cursor style
    this.set_cursor(Gdk.Cursor.new_from_name('crosshair', null));

    // pinch to zoom delta
    this.pinchDelta = 0;
  }

  on_copy() {
    // console.log("-------- Copy --------")
  }

  on_paste() {
    // console.log("-------- Paste --------")
  }

  on_undo() {
    // console.log("-------- Undo --------")
  }

  on_style_change() {
    if (this.styleManager.get_dark()) {
      this.core.settings.canvasbackgroundcolour = '#1e1e1e';
    } else {
      this.core.settings.canvasbackgroundcolour = '#f6f5f4';
    }
    this.queue_draw();
  }

  painting_callback() {
    this.queue_draw();
  }

  propertyCallback() {
    // console.log("Canvas - Property Callback")
    this.emit('selection-updated');
  }

  on_draw(area, cr, width, height) {
    // this is the main drawing function for the canvas
    // this is triggered by design core calling the painting_callback()
    this.core.canvas.paint(cr, width, height);
    cr.$dispose();
  }

  commandLineUpdateCallback(commandLineValue) {
    this.emit('commandline-updated', commandLineValue);
  }

  on_key_press(controller, keyval, keycode, state) {
    // forward key press info to the commandline object
    // unless a modifier key is pressed CTRL, TAB, CAPSLOCK

    const event = controller.get_current_event();

    if (event.is_modifier()) {
      return;
    }

    this.commandLine.key_pressed(keyval, keycode);
  }

  mouseMove(controller, x, y) {
    this.core.mouse.mouseMoved(x, y);
    this.emit('mouseposition-updated', this.core.mouse.positionString());
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

    // emit input changed so the window can hide / show widgets
    this.emit('input-changed', true);

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
