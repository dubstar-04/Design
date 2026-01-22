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
import { Patterns } from '../../Design-Core/core/lib/patterns.js';

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
    const types = DesignCore.PropertyManager.getItemTypes();
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
    DesignCore.PropertyManager.setItemProperties(property, value, selectedType);
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
    const properties = DesignCore.PropertyManager.getItemProperties(selectedType);

    if (!properties) {
      return;
    }

    this.clearPropertiesList();

    if (properties.length) {
      for (let i = 0; i < properties.length; i++) {
        const value = DesignCore.PropertyManager.getItemPropertyValue(selectedType, properties[i]);

        let suffixWidget;
        const property = properties[i];
        const widgetWidth = 175;

        switch (property) {
          // Numeric type properties
          case 'height':
          case 'rotation':
          case 'radius':
          case 'width':
          case 'lineWidth':
          case 'scale':
          case 'angle':
          case 'characterSpacing':
          case 'lineSpacing':
          case 'startAngle':
          case 'endAngle':
          case 'offsetFromArc':
          case 'offsetFromLeft':
          case 'offsetFromRight':
          case 'widthFactor':
            suffixWidget = new Gtk.Entry({ valign: Gtk.Align.CENTER, text: `${value}` });
            suffixWidget.width_request = widgetWidth;
            const changedSignal = suffixWidget.connect('changed', () => {
              // block the change signal being emitted during update
              GObject.signal_handler_block(suffixWidget, changedSignal);

              let text = suffixWidget.text;
              // Check if the entry characters that aren't numbers
              if (text.match(/[^\d.]/i)) {
                // remove anything thats not a number or a decimal point
                text = text.replace(/[^\d.]/g, '');
                suffixWidget.set_text(text);
              }
              // Allow only one point.
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
          // Boolean type properties
          case 'backwards':
          case 'textReversed':
          case 'upsideDown':
          case 'bold':
          case 'underline':
          case 'italic':
            suffixWidget = new Gtk.Switch({ valign: Gtk.Align.CENTER, state: value });
            suffixWidget.connect('notify::active', () => {
              this.onValueChanged(`${property}`, suffixWidget.state);
            });
            break;
          // option type properties
          case 'layer':
          case 'styleName':
          case 'lineType':
          case 'patternName':
          case 'dimensionStyle':
          case 'textAlignment':
          case 'textOrientation':
          case 'arcSide':
            const model = this.getModel(property);
          case 'horizontalAlignment':
          case 'verticalAlignment':
            suffixWidget = Gtk.DropDown.new_from_strings(model.map((item) => item.display));
            suffixWidget.width_request = widgetWidth;
            suffixWidget.valign = Gtk.Align.CENTER;
            // get the position of the current value
            const selectedIndex = model.findIndex((item) => item.value === value);
            if (selectedIndex >= 0) {
              suffixWidget.set_selected(selectedIndex);
            }
            suffixWidget.connect('notify::selected-item', () => {
              // console.log('update style:', `${property}`, suffixWidget.get_selected_item().get_string());
              const selectedString = suffixWidget.get_selected_item().get_string();
              const selectedItem = model.find((item) => item.display === selectedString);
              DesignCore.PropertyManager.setItemProperties(`${property}`, selectedItem.value);
              // suffixWidget.get_selected_item().get_string());
            });
            break;
          // String type properties
          case 'string':
          case 'textOverride':
            suffixWidget = new Gtk.Entry({ valign: Gtk.Align.CENTER, text: `${value}` });
            suffixWidget.width_request = widgetWidth;
            suffixWidget.connect('activate', () => {
              this.onValueChanged(`${property}`, suffixWidget.text);
            });
            break;
            // String type properties

          case 'colour':
            continue;
          /*
            // TODO: Create a custom widget that can display, bylayer, various and show a colour
            suffixWidget = new Gtk.Button({valign: Gtk.Align.CENTER});
            suffixWidget.width_request = widgetWidth;
            suffixWidget.set_label(value);

            suffixWidget.connect('clicked', () => {
              const colorChooser = new Gtk.ColorChooserDialog({
                modal: true,
                // TODO: Set the current colour
                // rgba: currentColour,
                transient_for: this,
              });

              colorChooser.show();
              colorChooser.connect('response', (dialog, response) => {
                if (response == Gtk.ResponseType.OK) {
                  const rgba = dialog.get_rgba().to_string();
                  const rgb = rgba.substr(4).split(')')[0].split(',');
                  const colour = Colours.rgbToHex(rgb[0], rgb[1], rgb[2]);
                  suffixWidget.set_label(colour);
                  this.onValueChanged(`${property}`, colour);
                }

                dialog.destroy();
              });
            });
            break;
            */
          default:
            // Non-editable properties
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

  /**
   * Return array of objects with keys: display and value
   * display is the human readable name
   * value is the actual value to be set
   * {display: 'Display Name', value: 0'}
   */
  getModel(property) {
    let model = [];
    switch (property) {
      case 'layer':
        model = [];
        for (const layer of DesignCore.LayerManager.getItems()) {
          model.push({ display: layer.name, value: layer.name });
        }
        break;
      case 'styleName':
        const styles = DesignCore.StyleManager.getItems();
        const styleNames = styles.map((style) => ({ display: style.name, value: style.name }));
        model = styleNames;
        break;
      case 'dimensionStyle':
        const dimSyles = DesignCore.DimStyleManager.getItems();
        const dimStyleNames = dimSyles.map((style) => ({ display: style.name, value: style.name }));
        model = dimStyleNames;
        break;
      case 'horizontalAlignment':
        model = [{ display: 'Left', value: 0 }, { display: 'Center', value: 1 }, { display: 'Right', value: 2 }];
        break;
      case 'verticalAlignment':
        model = [{ display: 'Baseline', value: 0 }, { display: 'Bottom', value: 1 }, { display: 'Middle', value: 2 }, { display: 'Top', value: 3 }];
        break;
      case 'lineType':
        const lineStyles = DesignCore.LTypeManager.getItems();
        const lineStyleNames = lineStyles.map((style) => ({ display: style.name, value: style.name }));
        model = lineStyleNames;
        break;
      case 'patternName':
        const patternNames = Object.keys(Patterns.hatch_patterns);
        model = patternNames.map((patternName) => ({ display: patternName, value: patternName }));
        break;
      case 'textAlignment':
        model = [{ display: 'Fit', value: 1 }, { display: 'Left', value: 2 }, { display: 'Right', value: 3 }, { display: 'Center', value: 4 }];
        break;
      case 'textOrientation':
        model = [{ display: 'Outward', value: 1 }, { display: 'Inward', value: 2 }];
        break;
      case 'arcSide':
        model = [{ display: 'Convex', value: 1 }, { display: 'Concave', value: 2 }];
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

