/* window.js
 *
 * Copyright 2022 Daniel Wood
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw?version=1';
import Cairo from 'cairo';

import { Core } from '../Design-Core/core.js';

export const DesignWindow = GObject.registerClass({
    GTypeName: 'DesignWindow',
    Template: 'resource:///wood/dan/design/ui/window.ui',
    InternalChildren: ['drawingArea', 'mousePosLabel', 'commandLineEntry', 'openButton', 'saveButton'],
}, class DesignWindow extends Adw.ApplicationWindow{
    _init(application) {
        super._init({ application });

      const open = new Gio.SimpleAction({
        name: "open",
        parameter_type: null,
      });
      open.connect("activate", this.openDialog.bind(this));
      this.add_action(open);

      const save = new Gio.SimpleAction({
        name: "save",
        parameter_type: null,
      });
      save.connect("activate", this.saveDialog.bind(this));
      this.add_action(save);

      const shortcuts = new Gio.SimpleAction({
        name: "shortcuts",
        parameter_type: null,
      });
      shortcuts.connect("activate", this.show_shortcuts_window.bind(this));
      this.add_action(shortcuts);

      this._openButton.connect('clicked', this.openDialog.bind(this));
      this._saveButton.connect('clicked', this.saveDialog.bind(this));

        var motion_event = Gtk.EventControllerMotion.new()
        motion_event.connect("motion", this.mouseMove.bind(this))
        this._drawingArea.add_controller(motion_event)

    	var click_gesture = Gtk.GestureClick.new()
        click_gesture.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
        click_gesture.set_button(0);
        click_gesture.connect("pressed", this.mouseDown.bind(this))
        click_gesture.connect("released", this.mouseUp.bind(this))
        this._drawingArea.add_controller(click_gesture)

        var scroll_event = Gtk.EventControllerScroll.new(Gtk.EventControllerScrollFlags.VERTICAL)
        scroll_event.connect("scroll", this.wheel.bind(this))
        this._drawingArea.add_controller(scroll_event)

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
        this._drawingArea.add_controller(zoom_gesture)

        var keyController = Gtk.EventControllerKey.new()
        keyController.connect('key-pressed', this.on_key_press.bind(this));
        //this.add_controller(keyController);
        this._drawingArea.add_controller(keyController)
        this._drawingArea.grab_focus();


        var keyController2 = Gtk.EventControllerKey.new()
        keyController2.connect('key-pressed', this.on_key_press.bind(this));
        //this.add_controller(keyController);
        this._commandLineEntry.add_controller(keyController2)


        this.core = new Core();

        this.core.commandLine.setUpdateFunction(this.commandLineUpdateCallback.bind(this));
        this.core.canvas.setExternalPaintCallbackFunction(this.painting_callback.bind(this));

        //this.core.canvas.setCanvasWidget(this._drawingArea);
        //var context = this._drawingArea.get_style_context()
        //log(context);
        //this.core.canvas.setCanvasWidget(this._drawingArea, context);

        //this.offscreen_surface = new Cairo.ImageSurface(Cairo.Format.RGB24, this._drawingArea.get_width(), this._drawingArea.get_height());

        //this.offscreen_surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, 100, 100);
        //this.ctx = new Cairo.Context(this.offscreen_surface);

        this.core.canvas.setCanvasWidget(this._drawingArea, this.ctx);
        this._drawingArea.set_draw_func(this.on_draw.bind(this));
    }


    show_shortcuts_window(){
      var shortcuts_win = Gtk.Builder.new_from_resource('/wood/dan/design/ui/shortcuts.ui').get_object('shortcuts')
      shortcuts_win.set_transient_for(this)
      shortcuts_win.present()
    }

        painting_callback(){
          this._drawingArea.queue_draw();
        }

        on_draw(area, cr, width, height) {
            this.core.canvas.paint(cr, width, height);
            // draw the offscreen context in the drawing area
            //cr.setSourceSurface(this.offscreen_surface, 0, 0);
            //cr.paint();
            cr.$dispose();
        }

    commandLineUpdateCallback(commandLineValue) {
        this._commandLineEntry.text  = commandLineValue;

    }

    on_key_press(controller, keyval, keycode, state){
		  //console.log("keypressed", controller, keyval, keycode, state);
		  console.log("Keycode:", keycode)
		  //keyboard events
		  //var event = controller.get_current_event();
		  //log(controller);

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
                        //controller.forward(this._commandLineEntry);
                }

                console.log("key:", key);

                this.core.commandLine.handleKeys(key);
            }

    mouseMove(controller, x, y){
		this.core.mouse.mouseMoved(x, y);
		this._mousePosLabel.label = this.core.mouse.positionString()
    }

    mouseDown(gesture, num, x, y, z){
    	console.log("mouseDown", gesture, num, x, y);
    	let event = gesture.get_current_event();
    	let btn = gesture.get_current_button() - 1
    	console.log("event", event, btn);
    	this.core.mouse.mouseDown(btn);
    }

    mouseUp(gesture, num, x, y, z){
    	console.log("mouseUp", gesture, num, x, y);
    	let event = gesture.get_current_event();
    	let btn = gesture.get_current_button() - 1
    	console.log("event", event, btn);
    	this.core.mouse.mouseUp(btn);
    }

    wheel(controller, x, y){
    	console.log("wheel", controller, x, y);
    	this.core.mouse.wheel(y);
    	this._drawingArea.queue_draw();
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
    	console.log("dragEnd", controller, x, y);
    	//this.core.mouse.wheel();
    }

    zoomBegin(controller, x, y){
    	console.log("zoomBegin", controller, x, y);
    	//this.core.mouse.wheel();

    }

    zoomEnd(controller, x, y){
    	console.log("zoomEnd", controller, x, y);
    	//this.core.mouse.wheel();
    }

  openDialog(){
    log("Open File")

    var action = Gtk.FileChooserAction.OPEN

    var filter = new Gtk.FileFilter();
    //filter.add_mime_type('text/plain');

    var dialog = new Gtk.FileChooserDialog({
        action: Gtk.FileChooserAction.OPEN,
        //filter: filter,
        select_multiple: false,
        transient_for: this,
        title: 'Open'
    });

    dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
    dialog.add_button('OK', Gtk.ResponseType.OK);

    dialog.show()
    dialog.connect("response", this.openFile.bind(this))
  };

  openFile(dialog, response){

    log("openFile")
    log(dialog)
    log(response)

      if (response == Gtk.ResponseType.OK)
      {
        log(" ok clicked")
        var file = dialog.get_file();
        dialog.destroy()
        //log(file)
        const [, contents, etag] = file.load_contents(null);
        //log(contents)
        //log(etag)
        const decoder = new TextDecoder('utf-8');
        const contentsString = decoder.decode(contents);
        this.core.openFile(contentsString)
      }

      dialog.destroy()
  }


  saveDialog(){
    log("save File dialog")

    var action = Gtk.FileChooserAction.SAVE

    var filter = new Gtk.FileFilter();
    //filter.add_mime_type('text/plain');

    var dialog = new Gtk.FileChooserDialog({
        action: Gtk.FileChooserAction.SAVE,
        //filter: filter,
        select_multiple: false,
        transient_for: this,
        title: 'Save As'
    });

    dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
    dialog.add_button('Save', Gtk.ResponseType.ACCEPT);

    dialog.show()
    dialog.connect("response", this.saveFile.bind(this))
  };

  saveFile(dialog, response){

    log("save File")
    log(dialog)
    log(response)

      if (response == Gtk.ResponseType.ACCEPT)
      {
        log("Save clicked:")
        var file = dialog.get_file();

        // Synchronous, blocking method
        const outputStream = file.create(Gio.FileCreateFlags.NONE, null);

        const dxfContents = this.core.saveFile();

        const [, etag] = file.replace_contents(dxfContents, null, false,
            Gio.FileCreateFlags.REPLACE_DESTINATION, null);
      }

      dialog.destroy()
  }

}

);




