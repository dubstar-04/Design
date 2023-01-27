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
import Adw from 'gi://Adw?version=1';

export const PreferencesWindow = GObject.registerClass({
  GTypeName: 'PreferencesWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences.ui',
  InternalChildren: [],
}, class PreferencesWindow extends Adw.PreferencesWindow {
  _init() {
    super._init({});

  }
}
);




