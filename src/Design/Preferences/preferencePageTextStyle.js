/* PreferencePageTextStyle.js
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
import Pango from 'gi://Pango';

import { PreferenceRow } from '../Widgets/preferenceRow.js';

import { DesignCore } from '../../Design-Core/core/designCore.js';

export const PreferencePageTextStyle = GObject.registerClass({
  GTypeName: 'PreferencePageTextStyle',
  Template: 'resource:///io/github/dubstar_04/design/ui/preferences/preferencePageTextStyle.ui',
  InternalChildren: ['stylesList', 'name', 'font', 'upsideDown', 'backwards', 'editStylePage'],
}, class PreferencePageTextStyle extends Adw.PreferencesPage {
  constructor() {
    super({});
    this.styleIndex = -1;
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
      const row = new PreferenceRow();
      row.title = style.name;
      row.set_current((style.name === DesignCore.StyleManager.getCstyle()));
      this._stylesList.append(row);

      row.connect('default-changed', this.setCurrentStyle.bind(this));
      row.connect('edit-style', this.editStyle.bind(this));
      row.connect('delete-style', this.removeStyle.bind(this));
      row.connect('activated', this.editStyle.bind(this));
    });
  }

  loadStyleProps(styleName) {
    this.loading = true;

    const style = DesignCore.StyleManager.getItemByName(styleName);
    if (style) {
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
      this.reload();
    }
  }

  // open the style edit subpage
  editStyle(row) {
    if (row) {
      this.styleIndex = DesignCore.StyleManager.getItemIndex(row.title);
      this.loadStyleProps(row.title);
      const parent = this.get_ancestor(Adw.PreferencesDialog);
      if (parent) {
        parent.push_subpage(this._editStylePage);
      }
    }
  }

  // delete style
  deleteStyle(row) {
    this.removeStyle(row);
  }

  // add style
  addItem() {
    DesignCore.StyleManager.newItem();
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
      const styleIndex = DesignCore.StyleManager.getItemIndex(styleName);
      DesignCore.StyleManager.deleteStyle(styleIndex);
      this.reload();
    }
  }

  onStyleUpdate(widget) {
    if (!widget) return;
    if (!this.loading) {
      // update core with the changed setting
      // get the widget value
      const value = widget.text || widget.selected || widget.active || widget.font_desc;

      if (widget.name === 'font') {
        const font = value.get_family();
        const textHeight = value.get_size() / Pango.SCALE;
        DesignCore.StyleManager.updateItem(this.styleIndex, 'font', font);
        DesignCore.StyleManager.updateItem(this.styleIndex, 'textHeight', textHeight);
      } else {
        DesignCore.StyleManager.updateItem(this.styleIndex, widget.name, value);

        if (widget.name === 'name') {
          // update the name in the style list if the name in core has changed
          const newName = DesignCore.StyleManager.getItemByIndex(this.styleIndex).name;
          // set the _name string - this is needed when the style name passed to core was invalid and a different name is used
          this._name.text = newName;
          this.reload();
        }
      }
    }
  }
},
);


