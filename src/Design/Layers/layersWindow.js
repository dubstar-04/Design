/* layersWindow.js
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

import { Colours } from '../../Design-Core/core/lib/colours.js';
import { DesignCore } from '../../Design-Core/core/designCore.js';

import { PreferenceRow } from '../Widgets/preferenceRow.js';

export const LayersWindow = GObject.registerClass({
  GTypeName: 'LayersWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/layers/layersWindow.ui',
  InternalChildren: ['navigation', 'layerList', 'nameEntry', 'visibilitySwitch', 'frozenSwitch', 'lockedSwitch', 'lineType', 'lineWeightLabel', 'plottingSwitch', 'editLayerPage'],
}, class LayersWindow extends Adw.Window {
  constructor() {
    super({});

    this.loading = true;
    this.selected_layer;

    // Reload layers when navigating back to the layer list
    this._navigation.connect('popped', this.reload.bind(this));
  }

  show() {
    this.present();
    this.reload();
  }

  toRgba(colour) {
    const rgba = new Gdk.RGBA();
    const scaledRGB = Colours.rgbToScaledRGB(colour);
    rgba.red = scaledRGB.r;
    rgba.green = scaledRGB.g;
    rgba.blue = scaledRGB.b;
    rgba.alpha = 1.0;
    return rgba;
  }

  getLineTypes() {
    const lineStyles = DesignCore.LTypeManager.getItems();
    // filter out BYLAYER and BYBLOCK
    const filteredLineStyles = lineStyles.filter((style) => !['BYLAYER', 'BYBLOCK'].includes(style.name.toUpperCase()));
    const lineStyleNames = filteredLineStyles.map((style) => style.name);
    return lineStyleNames;
  }

  reload() {
    this.clearList();
    this.loadLayers();
  }

  clearList() {
    // delete all current children
    let child = this._layerList.get_first_child();

    while (child) {
      const next = child.get_next_sibling();
      this._layerList.remove(child);
      child = next;
    }
  }

  loadLayers() {
    const layers = DesignCore.LayerManager.getItems();
    const clayer = DesignCore.LayerManager.getCstyle();

    for (let i = 0; i < layers.length; i++) {
      const row = new PreferenceRow();
      row.title = layers[i].name;
      row.set_current(layers[i].name === clayer);
      this._layerList.append(row);

      row.connect('default-changed', this.setCurrentLayer.bind(this));
      row.connect('edit-style', this.onEditLayer.bind(this));
      row.connect('delete-style', this.onLayerDelete.bind(this));
      row.connect('activated', this.onEditLayer.bind(this));

      const colourButton = new Gtk.ColorButton({ 'valign': Gtk.Align.CENTER, 'rgba': this.toRgba(layers[i].colour) });
      colourButton.connect('color-set', this.onColourChange.bind(this));

      row.add_prefix(colourButton);
    }
  }

  onColourChange(colourButton) {
    const row = colourButton.get_ancestor(Adw.ActionRow);
    const layer = DesignCore.LayerManager.getItemByName(row.title);
    const rgba = colourButton.rgba.to_string();
    const rgb = rgba.substr(4).split(')')[0].split(',');
    // log(rgb)
    const colour = { r: Number(rgb[0]), g: Number(rgb[1]), b: Number(rgb[2]) };
    // log(colour)
    layer.colour = colour;
    this.get_transient_for().getActiveCanvas().queue_draw();
  }

  onNewClicked() {
    // console.log("new clicked")
    DesignCore.LayerManager.newItem();
    this.reload();
  }

  setCurrentLayer(row) {
    if (row) {
      DesignCore.LayerManager.setCstyle(row.title);
      this.reload();
    }
  }

  onEditLayer(row) {
    // set selected layer
    this.selected_layer = DesignCore.LayerManager.getItemByName(row.title);

    // set loading state to prevent layer changes while setting widget state
    this.loading = true;

    this._nameEntry.text = this.selected_layer.name;
    this._visibilitySwitch.active = this.selected_layer.on;
    this._frozenSwitch.active = this.selected_layer.frozen;
    this._lockedSwitch.active = this.selected_layer.locked;

    // set line type model and current index
    const lineTypeNames = this.getLineTypes();
    this._lineType.set_model(Gtk.StringList.new(lineTypeNames));
    const selectedIndex = lineTypeNames.indexOf(this.selected_layer.lineType);

    if (selectedIndex >= 0) {
      this._lineType.set_selected(selectedIndex);
    }

    this._lineWeightLabel.label = this.selected_layer.lineWeight.toString();
    this._plottingSwitch.active = this.selected_layer.plotting;

    // show the edit layer page
    this._navigation.push(this._editLayerPage);

    this.loading = false;
  }

  onLayerUpdate() {
    // loading is true when setting widget state
    // don't update layer state during loading
    if (this.loading) {
      return;
    }

    const layerIndex = DesignCore.LayerManager.getItemIndex(this.selected_layer.name);
    DesignCore.LayerManager.renameStyle(layerIndex, this._nameEntry.text);
    this.selected_layer.on = this._visibilitySwitch.active;
    this.selected_layer.frozen = this._frozenSwitch.active;
    this.selected_layer.locked = this._lockedSwitch.active;
    const selectedLineType = this._lineType.get_selected_item().get_string();
    this.selected_layer.lineType = selectedLineType;

    this.selected_layer.plotting = this._plottingSwitch.active;
    this.get_transient_for().getActiveCanvas().queue_draw();
    // this.reload();
  }


  onLayerDelete(row) {
    if (row) {
      const dialog = new Adw.AlertDialog({
        heading: 'Delete Layer?',
        body: `Delete Layer: ${row.title}?`,
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

  deleteStyle(layerName) {
    // console.log("delete layer")
    DesignCore.LayerManager.deleteStyle(DesignCore.LayerManager.getItemIndex(layerName));
    this.reload();
    this.get_transient_for().getActiveCanvas().queue_draw();
  }
}, // window
);


