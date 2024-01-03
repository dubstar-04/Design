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

import {Core} from '../Design-Core/core/core.js';

export const PreferencePageDimensionStyle = GObject.registerClass({
  Properties: {},
  GTypeName: 'PreferencePageDimensionStyle',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferencePageDimensionStyle.ui',
  InternalChildren: ['stylesList', 'style_name'],

}, class PreferencePageDimensionStyle extends Adw.PreferencesPage {
  constructor() {
    super();
    this.load();

    // this.loadStyleData();
  }

  reload() {
    this.clearStyleList();
    this.load();
  }

  getTextStyles() {
    // return new Gtk.StringList(['one', 'two']);

    const textStyles = new Gtk.StringList();
    const styles = Core.StyleManager.getStyles();

    styles.forEach((style) => {
      textStyles.append(style.name);
    });

    return textStyles;
  }

  /*
  loadStyleData() {
    console.log(this.get_internal_children());
    // delete all current children
    let child = this.get_first_child();
    while (child) {
      console.log('child', child);
      const next = child.get_next_sibling();
      child = next;
    }
  }
  */

  getValue() {
    console.log('getting value');
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
    const styles = Core.DimStyleManager.getStyles();

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

      if (style.name === Core.DimStyleManager.getCstyle()) {
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
      const style = Core.DimStyleManager.getStyleByName(row.title);
      // this.example_property = style;
      this._style_name.set_text(style.name);
    }
  }

  setCurrentStyle(row) {
    if (row) {
      console.log('Set Current Style:', row.title, row.id);
      Core.DimStyleManager.setCstyle(row.title);
    }
  }

  addStyle() {
    console.log('Add Style');
    Core.DimStyleManager.newStyle();
    this.reload();

    const newRow = this._stylesList.get_row_at_index(Core.DimStyleManager.styleCount() - 1);
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
      Core.DimStyleManager.deleteStyle(row.id);
      this.reload();
    }
  }

  onStyleUpdate(widget) {
    // update core with the changed setting
    console.log('onStyleUpdate - widget name:', widget.name, widget.type);


    const value = widget.text || widget.selected || widget.active;

    if (widget.model !== undefined) {
      console.log('model value', widget.model.get_string(widget.selected));
      console.log('selected item value', widget.get_selected_item().get_string());
    }

    console.log('widget value:', value);

    /*
    const row = this._stylesList.get_selected_row();
    if (row) {
      console.log(
          this._style_name.text,
      );

      const name = this._style_name.text;
      Core.DimStyleManager.updateStyle(row.id, 'name', name);
    }
    */
  }
},
);


