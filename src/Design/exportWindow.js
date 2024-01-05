/* ExportWindow.js
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

import {DesignCore} from '../Design-Core/core/designCore.js';

import {FileIO} from './fileIO.js';

export const ExportWindow = GObject.registerClass({
  GTypeName: 'ExportWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/export.ui',
  InternalChildren: ['versionList'],
}, class ExportWindow extends Adw.Window {
  constructor() {
    super({});

    this.version;
    this.radioButtonGroup;
  }

  show() {
    this.present();
    this.loadVersions();
  }

  loadVersions() {
    const versions = DesignCore.Core.supportedDXFVersions();


    for (const [key, value] of Object.entries(versions)) {
      const propRow = new Adw.ActionRow({title: key, subtitle: value});
      const radioButton = new Gtk.CheckButton();
      radioButton.connect('toggled', this.onChecked.bind(this));
      radioButton.id = key;

      if (key === Object.keys(versions)[0]) {
        this.radioButtonGroup = radioButton;
        radioButton.set_active(true);
      } else {
        radioButton.group = this.radioButtonGroup;
      }


      propRow.add_prefix(radioButton);
      this._versionList.add(propRow);
    }
  }

  onChecked(radioButton) {
    const state = radioButton.get_active();
    if (state) {
      this.version = radioButton.id;
    }
  }

  onSaveAsClicked() {
    const mainWindow = this.get_transient_for();
    FileIO.saveDialog(mainWindow, this.version);
    this.close();
  }
}, // window
);

