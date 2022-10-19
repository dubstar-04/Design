import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

import { Core } from '../Design-Core/core.js';

export var Canvas = GObject.registerClass({
    GTypeName: 'Canvas',
    Properties: {},
    Signals: {
        'commandline-updated': { param_types: [GObject.TYPE_STRING] },
        'mouseposition-updated': { param_types: [GObject.TYPE_STRING] },
        'selection-updated': {},
    },
}, class Canvas extends Gtk.DrawingArea {
    constructor() {
        super();

        // set the drawing area as focusable or we don't get events
        this.focusable = true;

        var motion_event = Gtk.EventControllerMotion.new()
        motion_event.connect("motion", this.mouseMove.bind(this))
        this.add_controller(motion_event)

        var click_gesture = Gtk.GestureClick.new()
        click_gesture.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
        click_gesture.set_button(0);
        click_gesture.connect("pressed", this.mouseDown.bind(this))
        click_gesture.connect("released", this.mouseUp.bind(this))
        this.add_controller(click_gesture)

        var scroll_event = Gtk.EventControllerScroll.new(Gtk.EventControllerScrollFlags.VERTICAL)
        scroll_event.connect("scroll", this.wheel.bind(this))
        this.add_controller(scroll_event)

        var zoom_gesture = Gtk.GestureZoom.new()
        zoom_gesture.set_propagation_phase(Gtk.PropagationPhase.BUBBLE)
        zoom_gesture.connect("begin", this.zoomBegin.bind(this))
        zoom_gesture.connect("scale-changed", this.zoomEnd.bind(this))
        this.add_controller(zoom_gesture)

        var keyController = Gtk.EventControllerKey.new()
        keyController.connect('key-pressed', this.on_key_press.bind(this));
        this.add_controller(keyController)

        const shortcutController = new Gtk.ShortcutController();

        const copy_shortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>C'), action: Gtk.CallbackAction.new(this.on_copy.bind(this))});
        shortcutController.add_shortcut(copy_shortcut)

        const paste_shortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>V'), action: Gtk.CallbackAction.new(this.on_paste.bind(this))});
        shortcutController.add_shortcut(paste_shortcut)

        const undo_shortcut = new Gtk.Shortcut({trigger: Gtk.ShortcutTrigger.parse_string('<Primary>Z'), action: Gtk.CallbackAction.new(this.on_undo.bind(this))});
        shortcutController.add_shortcut(undo_shortcut)

        this.add_controller(shortcutController);

        this.core = new Core();

        this.core.canvas.setCanvasWidget(this._drawingArea, this.ctx);
        this.set_draw_func(this.on_draw.bind(this));

        this.core.commandLine.setUpdateFunction(this.commandLineUpdateCallback.bind(this));
        this.core.canvas.setExternalPaintCallbackFunction(this.painting_callback.bind(this));
        this.core.propertyManager.setPropertyCallbackFunction(this.propertyCallback.bind(this))

        this.commandline_widget;

    }

    on_copy(){
        console.log("-------- Copy --------")
    }

    on_paste(){
        console.log("-------- Paste --------")
    }

    on_undo(){
        console.log("-------- Undo --------")
    }

    init(commandline_widget) {
        // hacky function to load the commandline value after the object has been created
        // this is needed because the emit function won't work until after the canvas is initialised
        this.core.commandLine.handleKeys('Escape');
        this.commandline_widget = commandline_widget;
        this.grab_focus()
    }

    painting_callback() {
        this.queue_draw();
    }

    propertyCallback() {
        console.log("Canvas - Property Callback")
        this.emit('selection-updated')
    }

    on_draw(area, cr, width, height) {
        // this is the main drawing function for the canvas
        // this is triggered by design core calling the painting_callback()
        this.core.canvas.paint(cr, width, height);
        cr.$dispose();
    }

    commandLineUpdateCallback(commandLineValue) {
        this.emit('commandline-updated', commandLineValue)
    }

    on_key_press(controller, keyval, keycode, state) {
        // forward key press info to the commandline object
        // unless control is pressed

        if (state !== Gdk.ModifierType.CONTROL_MASK){
            this.commandline_widget.key_pressed(keyval, keycode)
        }
    }

    mouseMove(controller, x, y) {
        this.core.mouse.mouseMoved(x, y);
        this.emit('mouseposition-updated', this.core.mouse.positionString())
    }

    mouseDown(gesture, num, x, y, z) {
        //console.log("mouseDown", gesture, num, x, y);
        let event = gesture.get_current_event();
        let btn = gesture.get_current_button() - 1
        //console.log("event", event, btn);
        this.core.mouse.mouseDown(btn);
        // ensure the canvas has focus to receive events
        this.grab_focus()
    }

    mouseUp(gesture, num, x, y, z) {
        //console.log("mouseUp", gesture, num, x, y);
        let event = gesture.get_current_event();
        let btn = gesture.get_current_button() - 1
        //console.log("event", event, btn);
        this.core.mouse.mouseUp(btn);
    }

    wheel(controller, x, y) {
        //console.log("wheel", controller, x, y);
        this.core.mouse.wheel(y);
        this.queue_draw();
    }

    dragBegin(controller, x, y) {
        //console.log("dragBegin", controller, x, y);
        //this.core.mouse.wheel();
    }

    dragUpdate(controller, x, y) {
        //console.log("dragUpdate", controller, x, y);
        //this.core.mouse.wheel();
    }

    dragEnd(controller, x, y) {
        //console.log("dragEnd", controller, x, y);
        //this.core.mouse.wheel();
    }

    zoomBegin(controller, x, y) {
        //console.log("zoomBegin", controller, x, y);
        //this.core.mouse.wheel();

    }

    zoomEnd(controller, x, y) {
        //console.log("zoomEnd", controller, x, y);
        //this.core.mouse.wheel();
    }

});
