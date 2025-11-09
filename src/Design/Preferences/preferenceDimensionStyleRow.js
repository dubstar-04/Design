/* PreferencesPageDimensionStyle.js
 *
 * Copyright 2024 Daniel Wood
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

export const PreferenceDimensionStyleRow = GObject.registerClass({
  Properties: {},
  GTypeName: 'PreferenceDimensionStyleRow',
  Signals: {
    'default-changed': { param_types: [GObject.TYPE_STRING] },
    'edit-style': { param_types: [GObject.TYPE_STRING] },
    'delete-style': { param_types: [GObject.TYPE_STRING] },
  },
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences/preferenceDimensionStyleRow.ui',
  InternalChildren: ['current_style_icon'],
}, class PreferenceDimensionStyleRow extends Adw.ActionRow {
  constructor() {
    super({});

    const dimensionStyle = new Gio.SimpleActionGroup();
    this.insert_action_group('dimension-style', dimensionStyle);

    // Add actions
    const makeDefault = new Gio.SimpleAction({ name: 'make-default' });
    dimensionStyle.add_action(makeDefault);
    makeDefault.connect('activate', this.makeDefault.bind(this));

    const edit = new Gio.SimpleAction({ name: 'edit' });
    dimensionStyle.add_action(edit);
    edit.connect('activate', this.editStyle.bind(this));

    const deleteStyle = new Gio.SimpleAction({ name: 'delete' });
    dimensionStyle.add_action(deleteStyle);
    deleteStyle.connect('activate', this.deleteStyle.bind(this));
  }

  set_current(isCurrent) {
    if (isCurrent) {
      this._current_style_icon.set_visible(true);
    } else {
      this._current_style_icon.set_visible(false);
    }
  }

  makeDefault() {
    console.log('Make Default:', this.title);
    this.emit('default-changed', this.title);
  }

  editStyle() {
    console.log('Edit Style:', this.title);
    this.emit('edit-style', this.title);
  }

  deleteStyle() {
    console.log('Delete Style:', this.title);
    this.emit('delete-style', this.title);
  }
},
);

