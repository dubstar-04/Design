/* window.js
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

import { Colours } from '../Design-Core/lib/colours.js'
//import resource from "../../ui/layers.ui";

export const PropertiesWindow = GObject.registerClass({
  GTypeName: 'PropertiesWindow',
  Template: 'resource:///wood/dan/design/ui/properties.ui',
  InternalChildren: ['stack','elementList', 'propertyList'],
}, class PropertiesWindow extends Adw.ApplicationWindow {
  _init(parent) {
    super._init({});

    this.mainWindow = parent;
    this.mainWindow.connect('canvas-selection-updated', this.on_selection_updated.bind(this))
    this.propertyManager;
    this.getPropertyManager();

  } //init

  on_selection_updated(){
    console.log("Properties Window: Selection Updated")
    this.loadSelectedItems();
  }

  on_back_clicked() {
    this._stack.set_visible_child_name("elementsPage")
    //this._backButton.visible = false
    //this.reloadLayers();
  }

  getPropertyManager() {
    this.propertyManager = this.mainWindow.get_active_canvas().core.propertyManager
  }

    clearList() {
    // delete all current children
    let child = this._elementList.get_first_child();

    while (child) {
      let next = child.get_next_sibling();
      this._elementList.remove(child);
      child = next;
    }
  }

    loadSelectedItems() {
      const types = this.propertyManager.getItemTypes();
      if(types.length){
        this.clearList();
        this._stack.set_visible_child_name("elementsPage")
      }else{
        this._stack.set_visible_child_name("propertiesStatusPage")
      }

      for (let i = 0; i < types.length; i++) {

        var row = new Adw.ActionRow({ title: types[i], activatable: true });
        row.connect('activated', this.on_item_selected.bind(this));
        this._elementList.append(row);
      }
  }

  //TODO: this is duplicated on the layers window
  toRgba(layerColour) {
    const rgba = new Gdk.RGBA();
    var colour = Colours.hexToScaledRGB(layerColour)
    rgba.red = colour.r;
    rgba.green = colour.g;
    rgba.blue = colour.b;
    rgba.alpha = 1.0;
    return rgba;
  }

  on_item_selected(row, two){
    if (row) {
      this._elementList.unselect_row(row)
      const properties = this.propertyManager.getItemProperties(row.title);
      if(properties.length){
        this._stack.set_visible_child_name("propertiesPage");

        for (let i = 0; i < properties.length; i++) {

                let value = this.propertyManager.getItemPropertyValue(row.title, properties[i])

                console.log("property value:", value)

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
                case "radius":
                    suffixWidget = new Gtk.Entry({ valign: Gtk.Align.CENTER, text: `${value}` });
                    break;
               // case "lineWidth":
               //     break;
               // case "colour":
               //     suffixWidget = new Gtk.ColorButton({ valign: Gtk.Align.CENTER, 'rgba': this.toRgba(value) });
               //     break;
                //case "layer":
                //    break;
                default:
                    suffixWidget = new Gtk.Label({ valign: Gtk.Align.CENTER, label: `${value}`});
                    break;
            }

        var prop_row = new Adw.ActionRow({ title: properties[i]});
        prop_row.add_suffix(suffixWidget)
        this._propertyList.append(prop_row);
      }
      }
      log(properties)
    }
  }

} //window
);





