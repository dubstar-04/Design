import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

export var CommandLine = GObject.registerClass({
    GTypeName: 'CommandLine',
    Properties: {},
    Signals: {},
}, class CommandLine extends Gtk.Entry{
    constructor() {
        super();

        this.mainWindow;

        var keyController = Gtk.EventControllerKey.new()
        keyController.connect('key-pressed', this.on_key_press.bind(this));
        this.add_controller(keyController)
    }

    set_parent(parent){
        this.mainWindow = parent;
    }

    on_key_press(controller, keyval, keycode, state) {
        this.key_pressed(keyval, keycode);
        }

    key_pressed(keyval, keycode){

        console.log("Commandline - keycode:", keycode)

        var key;

        switch (keycode) {
            case 9: // Escape
                key = "Escape";
                break;
            case 20: //Minus
                break;
            case 21: //Equals
                break;
            case 22: //Backspace
                key = "Backspace";
                break;
            case 23: //Tab
                break;
            case 36: //Enter
                key = "Enter";
                break;
            case 37: // Ctrl
                //key = "Ctrl";
                break;
            case 49: //acute
                break;
            case 50: // Shift
                //key = "Shift";
                break;
            case 59: //comma
                key = ",";
                break;
            case 64: // Alt_L
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
                //showSettings()
                //changeTab(event, 'Help')
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

            default:
                key = Gdk.keyval_name(keyval)
        }

        if(key) {
            this.mainWindow.get_active_canvas().core.commandLine.handleKeys(key);
        }

    }
});
