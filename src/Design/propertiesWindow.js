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

  getLayerManager() {
    return this.mainWindow.get_active_canvas().core.layerManager;
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
        const property = properties[i];

        switch (property) {
          // Numeric type properties
          case 'height':
          case 'rotation':
          case 'radius':
          case 'width':
          case 'lineWidth':
            suffixWidget = new Gtk.Entry({valign: Gtk.Align.CENTER, text: `${value}`});
            const changedSignal = suffixWidget.connect('changed', () => {
              // TODO: allow only one point.
              const text = suffixWidget.text.replace(/[^0-9.]/g, '');
              // block the change signal being emitted during update
              GObject.signal_handler_block(suffixWidget, changedSignal);
              suffixWidget.set_text(text);
              // unblock the change signal
              GObject.signal_handler_unblock(suffixWidget, changedSignal);
              // TODO: set the cursor position
            });
            suffixWidget.connect('activate', () => {
              this.propertyManager.setItemProperties(`${property}`, Number(suffixWidget.text));
            });
            break;
          // Boolean type properties
          case 'backwards':
          case 'upsideDown':
            suffixWidget = new Gtk.Switch({valign: Gtk.Align.CENTER, state: value});
            suffixWidget.connect('notify::active', () => {
              this.propertyManager.setItemProperties(`${property}`, suffixWidget.state);
            });
            break;
            // option type properties
          case 'layer':
          case 'styleName':
          case 'horizontalAlignment':
          case 'verticalAlignment':
            const model = this.getModel(property);
            suffixWidget = Gtk.DropDown.new_from_strings(model);
            // get the position of the current value
            const selectedIndex = model.indexOf(value);
            if (selectedIndex >= 0) {
              suffixWidget.set_selected(selectedIndex);
            }
            suffixWidget.connect('notify::selected-item', () => {
              this.propertyManager.setItemProperties(`${property}`, suffixWidget.get_selected_item().get_string());
            });
            break;
          // String type properties
          case 'string':
            suffixWidget = new Gtk.Entry({valign: Gtk.Align.CENTER, text: `${value}`});
            suffixWidget.set_input_purpose(Gtk.INPUT_PURPOSE_FREEFORM);
            suffixWidget.connect('activate', () => {
              this.propertyManager.setItemProperties(`${property}`, suffixWidget.text);
            });
            break;
            // String type properties
          case 'colour':
            suffixWidget = new Gtk.ColorButton({valign: Gtk.Align.CENTER});
            if (value.toUpperCase().includes('LAYER') ) {
              // TODO: Handle colour bu layer
            } else {
              suffixWidget.rgba = this.toRgba(value);
            }
            suffixWidget.connect('color-set', () => {
              // TODO: move this to core
              const rgba = suffixWidget.rgba.to_string();
              const rgb = rgba.substr(4).split(')')[0].split(',');
              const colour = Colours.rgbToHex(rgb[0], rgb[1], rgb[2]);
              this.propertyManager.setItemProperties(`${property}`, colour);
            });
            break;
          default:
            // Non-editable properties
            suffixWidget = new Gtk.Label({valign: Gtk.Align.CENTER, label: `${value}`});
            break;
        }

        const propRow = new Adw.ActionRow({title: property});
        propRow.add_suffix(suffixWidget);
        this._elementList.append(propRow);
      }
    }
  }

  getModel(property) {
    let model = [];
    switch (property) {
      case 'layer':
        model = [];
        const layerManager = this.getLayerManager();
        for (const layer of layerManager.getLayers()) {
          model.push(layer.name);
        }
        break;
      case 'styleName':
        // TODO: build model for styles
        model = ['style1', 'style2', 'style3'];
        break;
      case 'horizontalAlignment':
        // TODO: build human readable model for alignment
        model = ['0', '1', '2', '3', '4', '5'];
        break;
      case 'verticalAlignment':
        // TODO: build human readable model for alignment
        model = ['0', '1', '2', '3'];
        break;
    }
    return model;
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


