/* propertiesWindow.js
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
import Gdk from 'gi://Gdk';

import { Colours } from '../../Design-Core/core/lib/colours.js';
import { DesignCore } from '../../Design-Core/core/designCore.js';
import { Property } from '../../Design-Core/core/properties/property.js';

export const PropertiesWindow = GObject.registerClass({
  GTypeName: 'PropertiesWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/properties/propertiesWindow.ui',
  InternalChildren: ['stack', 'elementSelector', 'elementList'],
}, class PropertiesWindow extends Adw.ApplicationWindow {
  constructor() {
    super({});
  }

  show() {
    this.present();
    this.reload();
  }

  reload() {
    this.clearPropertiesList();
    this.loadSelectedItems();
  }

  clearPropertiesList() {
    // delete all current children
    let child = this._elementList.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      this._elementList.remove(child);
      child = next;
    }
  }

  loadSelectedItems() {
    const types = DesignCore.PropertyManager.getEntityTypes();
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

  formatDisplayName(name) {
    // Ensure first char is uppercase
    let formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    // Add a space before uppercase chars
    formattedName = formattedName.split(/(?=[A-Z])/).join(' ');
    return formattedName;
  }

  /** Handle a property value being changed */
  onValueChanged(property, value) {
    const selectedType = this.getFilterValue();
    DesignCore.PropertyManager.setEntityProperties(property, value, selectedType);
  }

  /** Get the currently selected filter value */
  getFilterValue() {
    const selectedIndex = this._elementSelector.get_selected();
    const typeStringList = this._elementSelector.get_model();
    const selectedType = typeStringList.get_string(selectedIndex);
    return selectedType;
  }

  onTypeChanged() {
    const selectedType = this.getFilterValue();
    const properties = DesignCore.PropertyManager.getEntityProperties(selectedType);

    if (!properties) {
      return;
    }

    this.clearPropertiesList();

    if (properties.length) {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const value = DesignCore.PropertyManager.getEntityPropertyValue(selectedType, property);
        const definition = DesignCore.PropertyManager.getEntityPropertyDefinition(selectedType, property);

        let suffixWidget;
        const widgetWidth = 175;

        switch (definition?.type) {
          case Property.Type.NUMBER: {
            suffixWidget = new Gtk.Entry({ valign: Gtk.Align.CENTER, text: `${value}` });
            suffixWidget.width_request = widgetWidth;
            const changedSignal = suffixWidget.connect('changed', () => {
              // block the change signal being emitted during update
              GObject.signal_handler_block(suffixWidget, changedSignal);

              let text = suffixWidget.text;
              // Remove anything that isn't a number or a decimal point
              if (text.match(/[^\d.]/i)) {
                text = text.replace(/[^\d.]/g, '');
                suffixWidget.set_text(text);
              }
              // Allow only one decimal point
              const dots = text.match(/\./g) || [];
              if (dots.length > 1) {
                const index = text.lastIndexOf('.');
                text = text.slice(0, index) + text.slice(index + 1);
                suffixWidget.set_text(text);
              }
              // unblock the change signal
              GObject.signal_handler_unblock(suffixWidget, changedSignal);
            });
            suffixWidget.connect('activate', () => {
              this.onValueChanged(`${property}`, Number(suffixWidget.text));
            });
            break;
          }

          case Property.Type.BOOLEAN:
            suffixWidget = new Gtk.Switch({ valign: Gtk.Align.CENTER, state: value });
            suffixWidget.connect('notify::active', () => {
              this.onValueChanged(`${property}`, suffixWidget.state);
            });
            break;

          case Property.Type.LIST: {
            let options = definition.options?.() ?? [];
            if (String(value).toUpperCase() === 'VARIES') {
              options = [{ display: 'Varies', value: 'VARIES' }].concat(options);
            }
            suffixWidget = Gtk.DropDown.new_from_strings(options.map((item) => item.display));
            suffixWidget.width_request = widgetWidth;
            suffixWidget.valign = Gtk.Align.CENTER;
            const selectedIndex = options.findIndex((item) => item.value === value);
            if (selectedIndex >= 0) {
              suffixWidget.set_selected(selectedIndex);
            }
            suffixWidget.connect('notify::selected-item', () => {
              const selectedString = suffixWidget.get_selected_item().get_string();
              const selectedItem = (definition.options?.() ?? []).find((item) => item.display === selectedString);
              // check the selected item is valid i.e. not 'Varies'
              if (selectedItem !== undefined) {
                this.onValueChanged(`${property}`, selectedItem.value);
              }
            });
            break;
          }

          case Property.Type.STRING:
            suffixWidget = new Gtk.Entry({ valign: Gtk.Align.CENTER, text: `${value}` });
            suffixWidget.width_request = widgetWidth;
            suffixWidget.connect('activate', () => {
              this.onValueChanged(`${property}`, suffixWidget.text);
            });
            break;

          case Property.Type.COLOUR:
            // TODO: Create a custom colour widget
            continue;

          case Property.Type.LABEL:
          default:
            // Read-only display
            suffixWidget = new Gtk.Label({ valign: Gtk.Align.CENTER, label: `${value}` });
            suffixWidget.width_request = widgetWidth;
            break;
        }

        // Get a formatted version of the property name
        const formattedName = this.formatDisplayName(property);
        const propRow = new Adw.ActionRow({ title: formattedName });
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

