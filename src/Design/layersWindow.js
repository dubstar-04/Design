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
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Colours} from '../Design-Core/core/lib/colours.js';
import {DesignCore} from '../Design-Core/core/designCore.js';

export const LayersWindow = GObject.registerClass({
  GTypeName: 'LayersWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/layers.ui',
  InternalChildren: ['layerList', 'stack', 'backButton', 'nameEntry', 'frozenSwitch', 'lockedSwitch', 'lineTypeLabel', 'lineWeightLabel', 'plottingSwitch'],
}, class LayersWindow extends Adw.ApplicationWindow {
  constructor() {
    super({});

    this.selected_layer;

    // Action to edit layers
    const layerEditAction = new Gio.SimpleAction({
      name: 'layerEditAction',
      parameter_type: GLib.VariantType.new('s'),
    });
    layerEditAction.connect('activate', this.onEditAction.bind(this));
    this.add_action(layerEditAction);

    // Action to delete layers
    const layerDeleteAction = new Gio.SimpleAction({
      name: 'layerDeleteAction',
      parameter_type: GLib.VariantType.new('s'),
    });
    layerDeleteAction.connect('activate', this.onDeleteAction.bind(this));
    this.add_action(layerDeleteAction);

    // Action to make layers current
    const layerCurrentAction = new Gio.SimpleAction({
      name: 'layerCurrentAction',
      parameter_type: GLib.VariantType.new('s'),
    });
    layerCurrentAction.connect('activate', this.onCurrentAction.bind(this));
    this.add_action(layerCurrentAction);
  }

  show() {
    this.present();
    this.reload();
  }

  onEditAction(simpleAction, parameters) {
    const layerName = parameters.deep_unpack();
    this.selected_layer = DesignCore.LayerManager.getStyleByName(layerName);
    this.onEditLayer();
  }

  onDeleteAction(simpleAction, parameters) {
    // console.log("delete action")
    const layerName = parameters.deep_unpack();
    this.selected_layer = DesignCore.LayerManager.getStyleByName(layerName);
    this.onLayerDelete();
  }

  onCurrentAction(simpleAction, parameters) {
    // console.log("current action")
    const layerName = parameters.deep_unpack();
    DesignCore.LayerManager.setCstyle(layerName);
    this.reload();
  }

  toRgba(layerColour) {
    const rgba = new Gdk.RGBA();
    const colour = Colours.hexToScaledRGB(layerColour);
    rgba.red = colour.r;
    rgba.green = colour.g;
    rgba.blue = colour.b;
    rgba.alpha = 1.0;
    return rgba;
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
    const layers = DesignCore.LayerManager.getStyles();
    const clayer = DesignCore.LayerManager.getCstyle();

    for (let i = 0; i < layers.length; i++) {
      const colourButton = new Gtk.ColorButton({'valign': Gtk.Align.CENTER, 'rgba': this.toRgba(layers[i].colour)});
      colourButton.connect('color-set', this.onColourChange.bind(this));

      const layerSwitch = new Gtk.Switch({valign: Gtk.Align.CENTER, active: layers[i].on});
      layerSwitch.connect('state-set', this.onToggled.bind(this));

      const menu = new Gio.Menu();
      menu.append(_('Edit'), `win.layerEditAction("${layers[i].name}")`);
      menu.append(_('Delete'), `win.layerDeleteAction("${layers[i].name}")`);
      menu.append(_('Make Current'), `win.layerCurrentAction("${layers[i].name}")`);
      const appMenu = Gtk.PopoverMenu.new_from_model(menu);

      const menuButton = new Gtk.MenuButton({popover: appMenu, valign: Gtk.Align.CENTER, icon_name: 'view-more-symbolic', css_classes: ['flat']});


      const row = new Adw.ActionRow({title: layers[i].name, activatable: true});
      row.connect('activated', this.onLayerSelected.bind(this));

      row.add_prefix(colourButton);
      row.add_suffix(layerSwitch);
      row.add_suffix(menuButton);

      if (layers[i].name === clayer) {
        row.set_icon_name('adw-entry-apply-symbolic');
      }

      this._layerList.append(row);
    }
  }

  onColourChange(colourButton) {
    const row = colourButton.get_ancestor(Adw.ActionRow);
    const layer = DesignCore.LayerManager.getStyleByName(row.title);
    const rgba = colourButton.rgba.to_string();
    const rgb = rgba.substr(4).split(')')[0].split(',');
    // log(rgb)
    const colour = Colours.rgbToHex(rgb[0], rgb[1], rgb[2]);
    // log(colour)
    layer.colour = colour;
    this.get_transient_for().getActiveCanvas().queue_draw();
  }

  onToggled(toggle, state) {
    // Get the row of the switch
    const row = toggle.get_ancestor(Adw.ActionRow);
    // get the layer reference from the layer manager
    const layer = DesignCore.LayerManager.getStyleByName(row.title);
    // change the layer state
    layer.on = state;
    // redraw
    this.get_transient_for().getActiveCanvas().queue_draw();
  }

  onBackClicked() {
    this._stack.set_visible_child_name('layerListPage');
    this._backButton.visible = false;
    this.reload();
  }

  onNewClicked() {
    // console.log("new clicked")
    DesignCore.LayerManager.newStyle();
    this.reload();
  }

  onLayerSelected(row) {
    if (row) {
      this._layerList.unselect_row(row);
      this.selected_layer = DesignCore.LayerManager.getStyleByName(row.title);
      this.onEditLayer();
    }
  }

  onEditLayer() {
    this._nameEntry.text = this.selected_layer.name;
    this._frozenSwitch.active = this.selected_layer.frozen;
    this._lockedSwitch.active = this.selected_layer.locked;
    this._lineTypeLabel.label = this.selected_layer.lineType;
    this._lineWeightLabel.label = this.selected_layer.lineWeight.toString();
    this._plottingSwitch.active = this.selected_layer.plotting;

    this._stack.set_visible_child_name('LayerDetailsPage');
    this._backButton.visible = true;
  }

  onLayerUpdate() {
    // console.log('update layer');
    // this.selected_layer.name = this._nameEntry.text;
    const layerIndex = DesignCore.LayerManager.getStyleIndex(this.selected_layer.name);
    DesignCore.LayerManager.renameStyle(layerIndex, this._nameEntry.text);
    this.selected_layer.frozen = this._frozenSwitch.active;
    this.selected_layer.locked = this._lockedSwitch.active;
    // this.selected_layer.lineType = this._lineTypeLabel.label;
    // this.selected_layer.lineWeight = this._lineWeightLabel.label;
    this.selected_layer.plotting = this._plottingSwitch.active;
    this.get_transient_for().getActiveCanvas().queue_draw();
  }

  onLayerDelete() {
    // console.log("delete")
    const dialog = new Adw.MessageDialog();
    dialog.set_transient_for(this);
    dialog.set_heading('Delete layer?');
    dialog.set_body('Delete layer: ' + this.selected_layer.name + ' ?');
    dialog.add_response('cancel', 'Cancel');
    dialog.add_response('delete', 'Delete');
    dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE);
    dialog.connect('response', this.onConfirmDialog.bind(this));
    dialog.present();
  }

  onConfirmDialog(dialog, response) {
    // console.log("delete dialog callback")
    if (response === 'delete') {
      this.deleteStyle(this.selected_layer.name);
      this.onBackClicked();
    }
  }

  deleteStyle(layerName) {
    // console.log("delete layer")
    DesignCore.LayerManager.deleteStyle(DesignCore.LayerManager.getStyleIndex(layerName));
    this.get_transient_for().getActiveCanvas().queue_draw();
  }
}, // window
);


