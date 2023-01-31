import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

import {Core} from '../Design-Core/core/core.js';

export const Canvas = GObject.registerClass({
  GTypeName: 'Canvas',
  Properties: {},
  Signals: {
    'commandline-updated': {param_types: [GObject.TYPE_STRING]},
    'mouseposition-updated': {param_types: [GObject.TYPE_STRING]},
    'selection-updated': {},
  },
}, class Canvas extends Gtk.DrawingArea {
  constructor() {
    super();

    // set the drawing area as focusable or we don't get events
    this.focusable = true;

    const motionEvent = Gtk.EventControllerMotion.new();
    motionEvent.connect('motion', this.mouseMove.bind(this));
    this.add_controller(motionEvent);

    const clickGesture = Gtk.GestureClick.new();
    clickGesture.set_propagation_phase(Gtk.PropagationPhase.CAPTURE);
    clickGesture.set_button(0);
    clickGesture.connect('pressed', this.mouseDown.bind(this));
    clickGesture.connect('released', this.mouseUp.bind(this));
    this.add_controller(clickGesture);

    const scrollEvent = Gtk.EventControllerScroll.new(Gtk.EventControllerScrollFlags.VERTICAL);
    scrollEvent.connect('scroll', this.wheel.bind(this));
    this.add_controller(scrollEvent);

    const zoomGesture = Gtk.GestureZoom.new();
    zoomGesture.set_propagation_phase(Gtk.PropagationPhase.BUBBLE);
    zoomGesture.connect('begin', this.zoomBegin.bind(this));
    zoomGesture.connect('scale-changed', this.zoomEnd.bind(this));
    this.add_controller(zoomGesture);

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

    this.core.canvas.setCanvasWidget(this._drawingArea, this.ctx);
    this.set_draw_func(this.on_draw.bind(this));

    this.core.commandLine.setUpdateFunction(this.commandLineUpdateCallback.bind(this));
    this.core.canvas.setExternalPaintCallbackFunction(this.painting_callback.bind(this));
    this.core.propertyManager.setPropertyCallbackFunction(this.propertyCallback.bind(this));

    this.commandlineWidget;
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

  init(commandlineWidget) {
    // hacky function to load the commandline value after the object has been created
    // this is needed because the emit function won't work until after the canvas is initialised
    this.core.commandLine.handleKeys('Escape');
    this.commandlineWidget = commandlineWidget;
    this.grab_focus();
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
    // unless control is pressed

    if (state !== Gdk.ModifierType.CONTROL_MASK) {
      this.commandlineWidget.key_pressed(keyval, keycode);
    }
  }

  mouseMove(controller, x, y) {
    this.core.mouse.mouseMoved(x, y);
    this.emit('mouseposition-updated', this.core.mouse.positionString());
  }

  mouseDown(gesture, num, x, y, z) {
    // // console.log("mouseDown", gesture, num, x, y);
    // const event = gesture.get_current_event();
    const btn = gesture.get_current_button() - 1;
    // // console.log("event", event, btn);
    this.core.mouse.mouseDown(btn);
    // ensure the canvas has focus to receive events
    this.grab_focus();
  }

  mouseUp(gesture, num, x, y, z) {
    // // console.log("mouseUp", gesture, num, x, y);
    // const event = gesture.get_current_event();
    const btn = gesture.get_current_button() - 1;
    // // console.log("event", event, btn);
    this.core.mouse.mouseUp(btn);
  }

  wheel(controller, x, y) {
    // // console.log("wheel", controller, x, y);
    this.core.mouse.wheel(y);
    this.queue_draw();
  }

  dragBegin(controller, x, y) {
    // // console.log("dragBegin", controller, x, y);
    // this.core.mouse.wheel();
  }

  dragUpdate(controller, x, y) {
    // // console.log("dragUpdate", controller, x, y);
    // this.core.mouse.wheel();
  }

  dragEnd(controller, x, y) {
    // // console.log("dragEnd", controller, x, y);
    // this.core.mouse.wheel();
  }

  zoomBegin(controller, x, y) {
    // // console.log("zoomBegin", controller, x, y);
    // this.core.mouse.wheel();

  }

  zoomEnd(controller, x, y) {
    // // console.log("zoomEnd", controller, x, y);
    // this.core.mouse.wheel();
  }
});
