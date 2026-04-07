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

const POLAR_ANGLES = ['22.5', '45', '90', '135'];

export const PreferencePageSettings = GObject.registerClass({
  GTypeName: 'PreferencePageSettings',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences/preferencePageSettings.ui',
  InternalChildren: ['polarAngle'],
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

    // Initialise the polar angle ComboRow from the saved setting
    const savedAngle = String(this.settings.getSetting('polarangle'));
    const idx = POLAR_ANGLES.indexOf(savedAngle);
    this._polarAngle.selected = idx >= 0 ? idx : 1;
  }

  onToggled(widget) {
    // update core with the changed setting, then sync all values back so any
    // side effects applied by core (e.g. mutual-exclusivity) are reflected in the UI
    this.settings.setCoreSetting(widget.name, widget.state);
    this.settings.syncFromCore();
  }

  onAngleSelected(widget) {
    const angle = POLAR_ANGLES[widget.selected];
    if (angle !== undefined) {
      this.settings.setCoreSetting('polarangle', Number(angle));
      this.settings.setSetting('polarangle', angle);
    }
  }
},
);


