/* PreferencePageSettings.js
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
import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';


export const PreferencePageSettings = GObject.registerClass({
  GTypeName: 'PreferencePageSettings',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences/preferencePageSettings.ui',
  InternalChildren: [],
}, class PreferencePageSettings extends Adw.PreferencesPage {
  constructor(settings) {
    super({});
    this.settings = settings;

    // create a new action group for the preference window
    this.settings_group = new Gio.SimpleActionGroup();
    this.insert_action_group('settings', this.settings_group);

    // get a list of settings keys
    const settingsKeys = this.settings.list_keys();
    settingsKeys.forEach((key) => {
      // Create an action for each key
      // These actions are assigned to the preference widgets in the .blp
      // These actions sync the widget state to the settings
      const action = this.settings.create_action(key);
      this.settings_group.add_action(action);
    });
  }

  onToggled(widget) {
    // update core with the changed setting
    this.settings.setCoreSetting(widget.name, widget.state);
  }
},
);


