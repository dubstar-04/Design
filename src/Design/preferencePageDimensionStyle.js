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

import {DesignCore} from '../Design-Core/core/designCore.js';

export const PreferencePageDimensionStyle = GObject.registerClass({
  Properties: {},
  GTypeName: 'PreferencePageDimensionStyle',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferencePageDimensionStyle.ui',
  InternalChildren: [
    // General
    'stylesList', 'name', 'DIMCLRD', 'DIMASZ', 'DIMCEN',
    // Text
    'DIMTXSTY', 'DIMCLRT', 'DIMGAP', 'DIMTAD', 'DIMJUST', 'DIMTIH',
    // Dimension
    /* 'DIMLWD',*/ 'DIMDLI', 'DIMSD1', 'DIMSD2',
    // Extensions
    /* 'DIMLWE',*/ 'DIMSE1', 'DIMSE2', 'DIMEXE', 'DIMEXO', /* 'DIMFXLON', 'DIMFXL',*/
  ],
}, class PreferencePageDimensionStyle extends Adw.PreferencesPage {
  constructor() {
    super();
    this.loading = true;
    this.reload();
  }

  reload() {
    this.clearStyleList();
    this.setModels();
    this.load();
  }

  setModels() {
    const styles = DesignCore.StyleManager.getItems();
    const styleNames = styles.map((style) => style.name);
    const textStyleModel = Gtk.StringList.new(styleNames);
    this._DIMTXSTY.set_model(textStyleModel);


    /*
    // Line Types only supported from R2007
    const lineTypes = DesignCore.LTypeManager.getItems();
    const lineTypeNames = lineTypes.map((ltype) => ltype.name);
    const lineTypeModel = Gtk.StringList.new(lineTypeNames);
    this._DIMLTYPE.set_model(lineTypeModel);
    */
  }

  /*
  modelFromArray( arrayData) {
    const model = new Gtk.StringList();

    arrayData.forEach((data) => {
      model.append(style.name);
    });

    return model;
  }
  */

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
    const styles = DesignCore.DimStyleManager.getItems();

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

      if (style.name === DesignCore.DimStyleManager.getCstyle()) {
        radioButton.set_active(true);
        this._stylesList.select_row(row);
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

      const style = DesignCore.DimStyleManager.getItemByName(row.title);

      for (const property in style) {
        if (Object.hasOwn(style, property)) {
          this.setRowValue(property, style[property]);
        }
      }
    }

    this.loading = false;
  }

  setRowValue(propertyName, value) {
    const widget = this[`_${propertyName}`];
    if (widget) {
      if ('model' in widget) {
        // check if the widget has a model set
        if (!widget.model) {
          return;
        }
        if ('set_selected' in widget) {
          if (typeof value === 'number') {
            // check the value (index) is within the bounds of the model elements
            if (value <= widget.model.get_n_items()) {
              widget.set_selected(value);
            } else {
              const msg = 'Invalid Model Index';
              const err = (`${this.type} - ${msg}: ${value}`);
              throw Error(err);
            }
          }
        }
      }

      if ('set_text' in widget) {
        if (typeof value === 'string') {
          widget.set_text(value);
        }
      }

      if ('set_value' in widget) {
        if (typeof value === 'number') {
          widget.set_value(value);
        }
      }

      if ('set_active' in widget) {
        if ( typeof value === 'boolean') {
          widget.set_active(value);
        }
      }
    }
  }

  setCurrentStyle(row) {
    if (row) {
      DesignCore.DimStyleManager.setCstyle(row.title);
    }
  }

  addItem() {
    DesignCore.DimStyleManager.newItem();
    this.reload();
    const newRow = this._stylesList.get_row_at_index(DesignCore.DimStyleManager.itemCount() - 1);
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
      DesignCore.DimStyleManager.deleteStyle(row.id);
      this.reload();
    }
  }

  onStyleUpdate(widget) {
    // update core with the changed setting
    if (!this.loading) {
      // get the widget value
      const value = widget.value || widget.text || widget.selected || widget.active;
      // console.log('\nvalues - text:', widget.text, 'value:', widget.value, 'selected:', widget.selected, 'active:', widget.active);

      const row = this._stylesList.get_selected_row();
      if (row) {
        // console.log('Style Update - Property:', widget.name, 'value:', value);
        DesignCore.DimStyleManager.updateItem(row.id, widget.name, value);

        if (widget.name === 'name') {
          // update the name in the style list if the name in core has changed
          const newName = DesignCore.DimStyleManager.getItemByIndex(row.id).name;
          row.title = newName;
          // set the _name string - this is needed when the style name passed to core was invalid and a different name is used
          this._name.text = newName;
        }
      }
    }
  }
},
);


