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

export const LayersWindow = GObject.registerClass({
  GTypeName: 'LayersWindow',
  Template: 'resource:///wood/dan/design/ui/layers.ui',
  InternalChildren: ['layerList'],
}, class LayersWindow extends Adw.Window {
  _init(parent) {
    super._init({ });

    this.mainWindow = parent;
    this.layerManager;

    this.getLayerManager();
    this.loadLayers()
    } //init

    getLayerManager(){
      this.layerManager = this.mainWindow.get_active_canvas().core.LM
    }

    toRgba(layerColour) {
      const rgba = new Gdk.RGBA();
      var colour = Colours.getRGBColour(layerColour)
      rgba.red = colour.r;
      rgba.green = colour.g;
      rgba.blue = colour.b;
      rgba.alpha = 1.0;
      return rgba;
    }

    loadLayers(){
      var layers = this.layerManager.getLayers()
      for (let i = 0; i < layers.length; i++) {

        var colourButton = new Gtk.ColorButton({valign: Gtk.Align.CENTER, 'rgba': this.toRgba(layers[i].colour)});
        var layerSwitch = new Gtk.Switch({ valign: Gtk.Align.CENTER, active: layers[i].on });
        var row =  new Adw.ExpanderRow({title: layers[i].name});
        row.add_prefix(colourButton)
        row.add_action(layerSwitch)
        this._layerList.append(row);
      }
    }

  } //window
);




