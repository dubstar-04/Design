/* preferencesWindow.js
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
import Gtk from 'gi://Gtk';
// import Gio from 'gi://Gio';
import Pango from 'gi://Pango';

import {Core} from '../Design-Core/core/core.js';

export const PreferencePageTextStyle = GObject.registerClass({
  GTypeName: 'PreferencePageTextStyle',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferencePageTextStyle.ui',
  InternalChildren: ['stylesList', 'style_name', 'font_button', 'fontupsidedown', 'fontbackwards'],
}, class PreferencePageTextStyle extends Adw.PreferencesPage {
  constructor() {
    super({});
    this.load();
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
    console.log('load ....');
    const styles = Core.StyleManager.getStyles();

    styles.forEach((style, index) => {
      const row = new Adw.ActionRow({title: style.name, activatable: true});
      const radioButton = new Gtk.CheckButton();
      row.connect('activated', this.onStyleSelected.bind(this));
      radioButton.connect('toggled', this.setCurrentStyle.bind(this, row));
      row.id = index;


      if (index === 0) {
        this.radioButtonGroup = radioButton;
      } else {
        radioButton.group = this.radioButtonGroup;
      }

      if (style.name === Core.StyleManager.getCstyle()) {
        radioButton.set_active(true);
        this._stylesList.select_row(row);
        this.onStyleSelected(row);
      }

      row.add_prefix(radioButton);
      this._stylesList.append(row);
    });
  }

  onStyleSelected(row) {
    console.log('onStyleSelected ....', row.id);

    if (row) {
      const style = Core.StyleManager.getStyleByName(row.title);

      console.log(style.upsideDown, style.backwards);

      this._fontupsidedown.set_active(style.upsideDown);

      const fontDesc = Pango.font_description_from_string(`${style.font} ${style.textHeight}`);
      this._style_name.set_text(style.name);
      this._font_button.set_font_desc(fontDesc);
      this._fontupsidedown.set_active(style.upsideDown);
      this._fontbackwards.set_active(style.backwards);
    }
  }

  setCurrentStyle(row) {
    if (row) {
      console.log('Set Current Style:', row.title, row.id);
      Core.StyleManager.setCstyle(row.title);
    }
  }

  addStyle() {
    console.log('Add Style');
    Core.StyleManager.newStyle();
    this.reload();

    const newRow = this._stylesList.get_row_at_index(Core.StyleManager.styleCount() - 1);
    console.log(newRow);
    this._stylesList.select_row(newRow);
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
      console.log('Remove Style:', row.title, row.id);
      Core.StyleManager.deleteStyle(row.id);
      this.reload();
    }
  }

  onStyleUpdate() {
    // update core with the changed setting
    console.log('onStyleUpdate - UI Loaded:', this.loaded);

    const row = this._stylesList.get_selected_row();
    if (row) {
      console.log(
          this._style_name.text,
          this._font_button.get_font_desc().get_family(),
          this._font_button.get_font_desc().get_size() / Pango.SCALE,
          this._fontupsidedown.get_active(),
          this._fontbackwards.get_active(),
      );

      const name = this._style_name.text;
      const font = this._font_button.get_font_desc().get_family();
      const textHeight = this._font_button.get_font_desc().get_size() / Pango.SCALE;
      const upsideDown = this._fontupsidedown.get_active();
      const backwards = this._fontbackwards.get_active();


      Core.StyleManager.updateStyle(row.id, 'name', name);
      row.title = name;
      Core.StyleManager.updateStyle(row.id, 'font', font);
      Core.StyleManager.updateStyle(row.id, 'textHeight', textHeight);
      Core.StyleManager.updateStyle(row.id, 'upsideDown', upsideDown);
      Core.StyleManager.updateStyle(row.id, 'backwards', backwards);
    }
    /*
      // this.reload();
      // get the reloaded row
      // const reloadedRow = this._stylesList.get_row_at_index(row.id);
      // this._stylesList.select_row(reloadedRow);
      // this.onStyleSelected(reloadedRow);

    }*/
  }
},
);


