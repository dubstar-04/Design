/* propertiesWindow.js
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
import Gdk from 'gi://Gdk';

import {Colours} from '../Design-Core/core/lib/colours.js';
// import resource from "../../ui/layers.ui";

export const PropertiesWindow = GObject.registerClass({
  GTypeName: 'PropertiesWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/properties.ui',
  InternalChildren: ['stack', 'elementSelector', 'elementList'],
}, class PropertiesWindow extends Adw.ApplicationWindow {
  constructor(parent) {
    super({});

    this.mainWindow = parent;
    this.connection = this.mainWindow.connect('canvas-selection-updated', this.on_selection_updated.bind(this));
    this.connect('close-request', this.on_close.bind(this));
    this.propertyManager;
    this.getPropertyManager();

    // attempt to load any currently selected entities
    this.on_selection_updated();
  }

  on_close() {
    // console.log("properties closing")
    this.mainWindow.disconnect(this.connection);
  }

  on_selection_updated() {
    // console.log("Properties Window: Selection Updated")
    this.loadSelectedItems();
  }

  getPropertyManager() {
    this.propertyManager = this.mainWindow.get_active_canvas().core.propertyManager;
  }

  clear_list() {
    // delete all current children
    let child = this._elementList.get_first_child();

    while (child) {
      const next = child.get_next_sibling();
      this._elementList.remove(child);
      child = next;
    }
  }

  loadSelectedItems() {
    const types = this.propertyManager.getItemTypes();
    if (types.length) {
      this._stack.set_visible_child_name('elementsPage');
    } else {
      this._stack.set_visible_child_name('propertiesStatusPage');
    }

    const model = new Gtk.StringList();

    for (let i = 0; i < types.length; i++) {
      model.append(types[i]);
    }

    this._elementSelector.set_model(model);
  }

  on_type_changed() {
    const selectedIndex = this._elementSelector.get_selected();
    const typeStringList = this._elementSelector.get_model();
    const selectedType = typeStringList.get_string(selectedIndex);

    const properties = this.propertyManager.getItemProperties(selectedType);

    if (!properties) {
      return;
    }

    this.clear_list();

    if (properties.length) {
      for (let i = 0; i < properties.length; i++) {
        const value = this.propertyManager.getItemPropertyValue(selectedType, properties[i]);

        let suffixWidget;

        switch (properties[i]) {
          /*
            case "width":
                break;
            case "height":
                break;
            case "rotation":
                break;
            */
          case 'radius':
            suffixWidget = new Gtk.Entry({valign: Gtk.Align.CENTER, text: `${value}`});
            break;
            // case "lineWidth":
            //     break;
            // case "colour":
            //     suffixWidget = new Gtk.ColorButton({ valign: Gtk.Align.CENTER, 'rgba': this.toRgba(value) });
            //     break;
            // case "layer":
            //    break;
          case 'height':
            suffixWidget = new Gtk.Entry({valign: Gtk.Align.CENTER, text: `${value}`});
            suffixWidget.connect('activate', () => {
              this.propertyManager.setItemProperties('height', suffixWidget.text);
            });
            break;
          case 'string':
            suffixWidget = new Gtk.Entry({valign: Gtk.Align.CENTER, text: `${value}`});
            suffixWidget.connect('activate', () => {
              this.propertyManager.setItemProperties('string', suffixWidget.text);
            });
            break;
          default:
            suffixWidget = new Gtk.Label({valign: Gtk.Align.CENTER, label: `${value}`});
            break;
        }

        const propRow = new Adw.ActionRow({title: properties[i]});
        propRow.add_suffix(suffixWidget);
        this._elementList.append(propRow);
      }
    }
  }

  // TODO: this is duplicated on the layers window
  toRgba(layerColour) {
    const rgba = new Gdk.RGBA();
    const colour = Colours.hexToScaledRGB(layerColour);
    rgba.red = colour.r;
    rgba.green = colour.g;
    rgba.blue = colour.b;
    rgba.alpha = 1.0;
    return rgba;
  }
}, // window
);


