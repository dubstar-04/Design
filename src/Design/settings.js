import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject'

export var Settings = GObject.registerClass({
    GTypeName: 'Settings',
    Properties: {},
    Signals: {},
    }, 
    class Settings extends Gio.Settings{
        constructor(window, props = {schema_id: "io.github.dubstar_04.design", path: "/io/github/dubstar_04/design/"}) {
        super(props);

        this.window = window
        this._keyTypes = {};     
        this.list_keys().forEach((key) => {
            this._keyTypes[key] = this.get_value(key)
                                            .get_type()
                                            .dup_string();
            });
        }

    sync_settings(){
        //sync the app settings with core
        this.list_keys().forEach((key_name) => {
            this.set_core_setting(key_name, this.get_setting(key_name)) 
        });
    }

    reset(){
        // return all settings to default
        // TODO: add function to reset all settings to default
    }

    get_core_setting(name){
        const value = this.window.get_active_canvas().core.settings.getSetting(name);
        return value;
    }

    set_core_setting(name, value) {
        this.window.get_active_canvas().core.settings.setSetting(name, value)
    }

    get_setting(name) {
        return this.get_value(name).deep_unpack();
    }

    set_setting(name, value) {
        this.set_value(name, GLib.Variant.new(this._keyTypes[name], value));
    }

});
