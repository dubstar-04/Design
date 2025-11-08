/* preferencesWindow.js
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
import Pango from 'gi://Pango';

import { DesignCore } from '../Design-Core/core/designCore.js';

export const PreferencePageTextStyle = GObject.registerClass({
  GTypeName: 'PreferencePageTextStyle',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferencePageTextStyle.ui',
  InternalChildren: ['stylesList', 'name', 'font', 'upsideDown', 'backwards'],
}, class PreferencePageTextStyle extends Adw.PreferencesPage {
  constructor() {
    super({});
    this.loading = true;
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
    const styles = DesignCore.StyleManager.getItems();

    styles.forEach((style, index) => {
      const row = new Adw.ActionRow({ title: style.name, activatable: true });
      const radioButton = new Gtk.CheckButton();
      row.connect('activated', this.onStyleSelected.bind(this));
      radioButton.connect('toggled', this.setCurrentStyle.bind(this, row));
      row.id = index;


      if (index === 0) {
        this.radioButtonGroup = radioButton;
      } else {
        radioButton.group = this.radioButtonGroup;
      }

      if (style.name === DesignCore.StyleManager.getCstyle()) {
        radioButton.set_active(true);
        this.onStyleSelected(row);
      }

      row.add_prefix(radioButton);
      this._stylesList.append(row);
    });
  }

  onStyleSelected(row) {
    this.loading = true;

    if (row) {
      // set the selected row
      this._stylesList.select_row(row);

      const style = DesignCore.StyleManager.getItemByName(row.title);
      const fontDesc = Pango.font_description_from_string(`${style.font} ${style.textHeight}`);
      this._name.set_text(style.name);
      this._font.set_font_desc(fontDesc);
      this._upsideDown.set_active(style.upsideDown);
      this._backwards.set_active(style.backwards);
    }

    this.loading = false;
  }

  setCurrentStyle(row) {
    if (row) {
      DesignCore.StyleManager.setCstyle(row.title);
    }
  }

  addItem() {
    DesignCore.StyleManager.newItem();
    this.reload();

    const newRow = this._stylesList.get_row_at_index(DesignCore.StyleManager.itemCount() - 1);
    this.onStyleSelected(newRow);
  }

  removeStyle() {
    const row = this._stylesList.get_selected_row();
    if (row) {
      const dialog = new Adw.MessageDialog();
      const parent = this.get_ancestor(Adw.PreferencesWindow);
      dialog.set_transient_for(parent);
      dialog.set_heading('Delete Style?');
      dialog.set_body(`Delete style: ${row.title}?`);
      dialog.add_response('cancel', 'Cancel');
      dialog.add_response('delete', 'Delete');
      dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE);
      dialog.connect('response', this.onConfirmDialog.bind(this));
      dialog.present();
    }
  }

  onConfirmDialog(dialog, response) {
    if (response === 'delete') {
      this.deleteStyle();
    }
  }

  deleteStyle() {
    const row = this._stylesList.get_selected_row();
    if (row) {
      DesignCore.StyleManager.deleteStyle(row.id);
      this.reload();
    }
  }

  onStyleUpdate(widget) {
    if (!this.loading) {
    // update core with the changed setting
      // get the widget value
      const value = widget.text || widget.selected || widget.active || widget.font_desc;

      const row = this._stylesList.get_selected_row();
      if (row) {
        if (widget.name === 'font') {
          const font = value.get_family();
          const textHeight = value.get_size() / Pango.SCALE;
          DesignCore.StyleManager.updateItem(row.id, 'font', font);
          DesignCore.StyleManager.updateItem(row.id, 'textHeight', textHeight);
        } else {
          DesignCore.StyleManager.updateItem(row.id, widget.name, value);

          if (widget.name === 'name') {
            // update the name in the style list if the name in core has changed
            const newName = DesignCore.StyleManager.getItemByIndex(row.id).name;
            row.title = newName;
            // set the _name string - this is needed when the style name passed to core was invalid and a different name is used
            this._name.text = newName;
          }
        }
      }
    }
  }
},
);


