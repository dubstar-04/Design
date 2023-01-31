/* settings.js
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

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

export const Settings = GObject.registerClass({
  GTypeName: 'Settings',
  Properties: {},
  Signals: {},
},
class Settings extends Gio.Settings {
  constructor(window, props = {schema_id: 'io.github.dubstar_04.design', path: '/io/github/dubstar_04/design/'}) {
    super(props);

    this.window = window;
    this._keyTypes = {};
    this.list_keys().forEach((key) => {
      this._keyTypes[key] = this.get_value(key)
          .get_type()
          .dup_string();
    });
  }

  sync_settings() {
    // sync the app settings with core
    this.list_keys().forEach((keyName) => {
      this.set_core_setting(keyName, this.get_setting(keyName));
    });
  }

  reset() {
    // return all settings to default
    // TODO: add function to reset all settings to default
  }

  get_core_setting(name) {
    const value = this.window.get_active_canvas().core.settings.getSetting(name);
    return value;
  }

  set_core_setting(name, value) {
    this.window.get_active_canvas().core.settings.setSetting(name, value);
  }

  get_setting(name) {
    return this.get_value(name).deep_unpack();
  }

  set_setting(name, value) {
    this.set_value(name, GLib.Variant.new(this._keyTypes[name], value));
  }
});
