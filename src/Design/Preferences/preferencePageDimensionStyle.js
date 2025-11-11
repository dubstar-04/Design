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
import Gtk from 'gi://Gtk';

import { DesignCore } from '../../Design-Core/core/designCore.js';
import { PreferenceRow } from '../Widgets/preferenceRow.js';

export const PreferencePageDimensionStyle = GObject.registerClass({
  Properties: {},
  GTypeName: 'PreferencePageDimensionStyle',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences/preferencePageDimensionStyle.ui',
  InternalChildren: [
    // General
    'stylesList',
    // Subpage
    'editDimensionStylePage',
    // Style
    'name',
    // Dimension Line
    /* 'DIMCLRD',  'DIMLTYPE','DIMLWD',*/ 'DIMDLI', 'DIMSD1', 'DIMSD2', 'DIMTOFL',
    // Extension Lines
    /* 'DIMCLRE', 'DIMTEX1', 'DIMTEX2', 'DIMLWE'*/ 'DIMSE1', 'DIMSE2', 'DIMEXE', 'DIMEXO', /* 'DIMFXLON', 'DIMFXL'*/
    // Symbols and Arrows
    'DIMASZ', 'DIMCENSTYL', 'DIMCENVALUE',
    // Text
    'DIMTXSTY', /* 'DIMCLRT',*/ 'DIMTXT', /* 'DIMTXTBOX',*/ 'DIMTAD', 'DIMJUST', 'DIMGAP', 'DIMTIH', 'DIMTOH',
    // Precision
    'DIMDEC', 'DIMADEC', 'DIMDSEP', 'DIMRND',
  ],
}, class PreferencePageDimensionStyle extends Adw.PreferencesPage {
  constructor() {
    super();

    this.styleIndex = -1;
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
      const row = new PreferenceRow();
      row.title = style.name;
      row.set_current((style.name === DesignCore.DimStyleManager.getCstyle()));
      this._stylesList.append(row);

      row.connect('default-changed', this.setCurrentStyle.bind(this));
      row.connect('edit-style', this.editStyle.bind(this));
      row.connect('delete-style', this.removeStyle.bind(this));
      row.connect('activated', this.editStyle.bind(this));
    });
  }

  loadStyleProps(styleName) {
    this.loading = true;
    const style = DesignCore.DimStyleManager.getItemByName(styleName);
    for (const property in style) {
      if (Object.hasOwn(style, property)) {
        this.setRowValue(property, style[property]);
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
        if (typeof value === 'boolean') {
          widget.set_active(value);
        }
      }
    }
  }

  // Action handlers for PreferenceStyleRow signals
  // set the current style
  setCurrentStyle(row) {
    if (row) {
      DesignCore.DimStyleManager.setCstyle(row.title);
      this.reload();
    }
  }

  // open the style edit subpage
  editStyle(row) {
    if (row) {
      this.styleIndex = DesignCore.DimStyleManager.getItemIndex(row.title);
      this.loadStyleProps(row.title);
      const parent = this.get_ancestor(Adw.PreferencesDialog);
      if (parent) {
        parent.push_subpage(this._editDimensionStylePage);
      }
    }
  }

  // delete the style
  deleteStyle(row) {
    this.removeStyle(row);
  }

  // Add new Dimension Style
  addItem() {
    DesignCore.DimStyleManager.newItem();
    this.reload();
  }

  removeStyle(row) {
    if (row) {
      const dialog = new Adw.AlertDialog({
        heading: 'Delete Style?',
        body: `Delete style: ${row.title}?`,
        close_response: 'cancel',
      });

      dialog.add_response('cancel', 'Cancel');
      dialog.add_response('delete', 'Delete');

      // Make the delete response style destructive
      dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE);

      const parent = this.get_ancestor(Adw.PreferencesDialog);
      dialog.connect('response', this.onConfirmDialog.bind(this, row));
      dialog.present(parent);
    }
  }

  onConfirmDialog(row, dialog, response) {
    if (response === 'delete') {
      this.deleteStyle(row.title);
    }
  }

  deleteStyle(styleName) {
    if (styleName) {
      const styleIndex = DesignCore.DimStyleManager.getItemIndex(styleName);
      DesignCore.DimStyleManager.deleteStyle(styleIndex);
      this.reload();
    }
  }


  onStyleUpdate(widget) {
    if (!widget) return;
    // update core with the changed setting
    if (!this.loading) {
      // get the widget value
      let value;
      if (widget.value !== undefined) value = widget.value;
      if (widget.text !== undefined) value = widget.text;
      if (widget.selected !== undefined) value = widget.selected;
      if (widget.active !== undefined) value = widget.active;

      DesignCore.DimStyleManager.updateItem(this.styleIndex, widget.name, value);

      if (widget.name === 'name') {
        // update the name in the style list if the name in core has changed
        const newName = DesignCore.DimStyleManager.getItemByIndex(this.styleIndex).name;
        this._name.text = newName;
        this.reload();
      }
    }
  }
},
);


