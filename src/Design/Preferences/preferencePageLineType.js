/* PreferencePageLineType.js
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
import Gtk from 'gi://Gtk';

import { DesignCore } from '../../Design-Core/core/designCore.js';

export const PreferencePageLineType = GObject.registerClass({
  GTypeName: 'PreferencePageLineType',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences/preferencePageLineType.ui',
  InternalChildren: ['stylesList'],
}, class PreferencePageLineType extends Adw.PreferencesPage {
  constructor() {
    super({});
    this.reload();
  }

  reload() {
    this.clearStyleList();
    this.load();
  }

  clearStyleList() {
    // delete all current children
    let child = this._stylesList.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      this._stylesList.remove(child);
      child = next;
    }
  }

  load() {
    const optionalStyles = DesignCore.LTypeManager.getOptionalStyles();

    optionalStyles.forEach((style, index) => {
      const row = new Adw.ActionRow(
          {
            title: style.name,
            subtitle: style.description,
          });

      const styleLoaded = DesignCore.LTypeManager.itemExists(style.name);
      const indelibleStyle = DesignCore.LTypeManager.indelibleItems.some((iStyle) => iStyle.toUpperCase() === style.name);

      const checkBox = new Gtk.CheckButton({ active: styleLoaded, sensitive: !(styleLoaded||indelibleStyle) });
      checkBox.connect('toggled', this.styleChecked.bind(this, row));
      row.id = index;

      row.add_prefix(checkBox);
      this._stylesList.append(row);
    });
  }


  styleChecked(row, checkBox) {
    if (row) {
      const optionalStyles = DesignCore.LTypeManager.getOptionalStyles();
      DesignCore.LTypeManager.addItem(optionalStyles[row.id]);
      this.reload();
    }
  }
},
);


