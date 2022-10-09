import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

import { Core } from '../Design-Core/core.js';

export var Canvas = GObject.registerClass({
    GTypeName: 'Canvas',
    Properties: {},
    Signals: {
    'commandline-updated': {param_types: [GObject.TYPE_STRING]},
    'mouseposition-updated': {param_types: [GObject.TYPE_STRING]},
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

        //var drag_gesture = Gtk.GestureDrag.new()
        //drag_gesture.set_propagation_phase(Gtk.PropagationPhase.BUBBLE)
        // set button: 1 = left, 2 = wheel, 3 = right;
        //drag_gesture.set_button(2);
        //drag_gesture.connect("drag-begin", this.dragBegin.bind(this))
        //drag_gesture.connect("drag-update", this.dragUpdate.bind(this))
        //drag_gesture.connect("drag-end", this.dragEnd.bind(this))
        //this._drawingArea.add_controller(drag_gesture)

    	  var zoom_gesture = Gtk.GestureZoom.new()
        zoom_gesture.set_propagation_phase(Gtk.PropagationPhase.BUBBLE)
        zoom_gesture.connect("begin", this.zoomBegin.bind(this))
        zoom_gesture.connect("scale-changed", this.zoomEnd.bind(this))
        this.add_controller(zoom_gesture)

        var keyController = Gtk.EventControllerKey.new()
        keyController.connect('key-pressed', this.on_key_press.bind(this));
        this.add_controller(keyController)

        this.core = new Core();

        this.core.canvas.setCanvasWidget(this._drawingArea, this.ctx);
        this.set_draw_func(this.on_draw.bind(this));

        this.core.commandLine.setUpdateFunction(this.commandLineUpdateCallback.bind(this));
        this.core.canvas.setExternalPaintCallbackFunction(this.painting_callback.bind(this));
    }

        init(){
          // hacky function to load the commandline value after the object has been created
          // this is needed because the emit function won't work until after the canva is initialised
          this.core.commandLine.handleKeys('Escape');
        }

        painting_callback(){
          this.queue_draw();
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

    on_key_press(controller, keyval, keycode, state){
		  //console.log("Keycode:", keycode)

		  //return Gdk.EVENT_STOP;
		  //return Gdk.EVENT_PROPAGATE;
                var key;

                switch (keycode) {
                    case 22: //Backspace
                        key = "Backspace";
                        break;
                    case 23: //Tab
                        break;
                    case 36: //Enter
                        key = "Enter";
                        break;
                    case 50: // Shift
                        break;
                    case 37: // Ctrl
                        break;
                    case 9: // Escape
                        key = "Escape";
                        break;
                    case 65: // space
                        key = "Space";
                        break;
                    case 113: // Left-Arrow
                        break;
                    case 111: // Up-Arrow
                        key = "Up-Arrow";
                        break;
                    case 114: // Right-Arrow
                        break;
                    case 116: // Down-Arrow
                        key = "Down-Arrow";
                        break;
                    case 119: // Delete
                        key = "Delete";
                        break;
                    case 112: // F1
                        showSettings()
                        changeTab(event, 'Help')
                        break;
                    case 113: // F2
                        break;
                    case 114: // F3
                        //this.disableSnaps(e);
                        break;
                    case 115: // F4
                        break;
                    case 116: // F5
                        break;
                    case 117: // F6
                        break;
                    case 118: // F7
                        //toggleSnap('drawGrid')
                        break;
                    case 119: // F8
                        //toggleSnap('ortho')
                        break;
                    case 120: // F9
                        break;
                    case 121: // F10
                        //toggleSnap('polar');
                        break;
                    case 122: // F11
                        break;
                    case 123: // F12
                        break;
                    case 59: //comma
                        key = ",";
                    break;

                    default:
                        key = Gdk.keyval_name(keyval)
                }

                console.log("key:", key);
                this.core.commandLine.handleKeys(key);
            }

    mouseMove(controller, x, y){
		  this.core.mouse.mouseMoved(x, y);
		  this.emit('mouseposition-updated', this.core.mouse.positionString())
    }

    mouseDown(gesture, num, x, y, z){
    	//console.log("mouseDown", gesture, num, x, y);
    	let event = gesture.get_current_event();
    	let btn = gesture.get_current_button() - 1
    	//console.log("event", event, btn);
    	this.core.mouse.mouseDown(btn);
    }

    mouseUp(gesture, num, x, y, z){
    	//console.log("mouseUp", gesture, num, x, y);
    	let event = gesture.get_current_event();
    	let btn = gesture.get_current_button() - 1
    	//console.log("event", event, btn);
    	this.core.mouse.mouseUp(btn);
    }

    wheel(controller, x, y){
    	//console.log("wheel", controller, x, y);
    	this.core.mouse.wheel(y);
    	this.queue_draw();
    }

    dragBegin(controller, x, y){
    	//console.log("dragBegin", controller, x, y);
    	//this.core.mouse.wheel();
    }

    dragUpdate(controller, x, y){
    	//console.log("dragUpdate", controller, x, y);
    	//this.core.mouse.wheel();
    }

    dragEnd(controller, x, y){
    	//console.log("dragEnd", controller, x, y);
    	//this.core.mouse.wheel();
    }

    zoomBegin(controller, x, y){
    	//console.log("zoomBegin", controller, x, y);
    	//this.core.mouse.wheel();

    }

    zoomEnd(controller, x, y){
    	//console.log("zoomEnd", controller, x, y);
    	//this.core.mouse.wheel();
    }

});
