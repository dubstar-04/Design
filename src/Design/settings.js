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

import { DesignCore } from '../Design-Core/core/designCore.js';

export const Settings = GObject.registerClass({
  GTypeName: 'Settings',
  Properties: {},
  Signals: {},
},
class Settings extends Gio.Settings {
  constructor(window, props = { schema_id: 'io.github.dubstar_04.design', path: '/io/github/dubstar_04/design/' }) {
    super(props);

    this.window = window;
    this._keyTypes = {};
    this.list_keys().forEach((key) => {
      this._keyTypes[key] = this.get_value(key)
          .get_type()
          .dup_string();
    });
  }

  syncSettings() {
    // sync the app settings with core
    this.list_keys().forEach((keyName) => {
      this.setCoreSetting(keyName, this.getSetting(keyName));
    });
  }

  reset() {
    // return all settings to default
    // TODO: add function to reset all settings to default
  }

  onSettingToggled(setting) {
    const state = this.getSetting(setting);
    this.setCoreSetting(setting, !state);
    this.setSetting(setting, !state);
  }

  getCoreSetting(name) {
    const value = DesignCore.Settings.getSetting(name);
    return value;
  }

  setCoreSetting(name, value) {
    DesignCore.Settings.setSetting(name, value);
  }

  getSetting(name) {
    return this.get_value(name).deep_unpack();
  }

  setSetting(name, value) {
    this.set_value(name, GLib.Variant.new(this._keyTypes[name], value));
  }
});
