/* commandLine.js
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

import Gtk from 'gi://Gtk?version=4.0';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

import { DesignCore } from '../Design-Core/core/designCore.js';


export const CommandLine = GObject.registerClass({
  GTypeName: 'CommandLine',
  Properties: {},
  Signals: {},
}, class CommandLine extends Gtk.Entry {
  constructor(window) {
    super();

    this.mainWindow = window;

    const keyController = Gtk.EventControllerKey.new();
    keyController.connect('key-pressed', this.onKeyPress.bind(this));
    this.add_controller(keyController);
  }

  reset() {
    // reset the commandline
    DesignCore.CommandLine.resetPrompt();
  }

  onKeyPress(controller, keyVal, keyCode, state) {
    this.keyPressed(keyVal, keyCode);
  }

  keyPressed(keyVal, keyCode) {
    // console.log('Commandline - keycode:', keyCode, 'keyval:', keyVal);

    let key;

    switch (keyCode) {
      case 9: // Escape
        key = 'Escape';
        break;
      case 22: // Backspace
        key = 'Backspace';
        break;
      case 23: // Tab
        break;
      case 36: // Enter
        key = 'Enter';
        break;
      case 104: // Numpad Enter
        key = 'Enter';
        break;
      case 65: // space
        key = 'Space';
        break;
      case 113: // Left-Arrow
        break;
      case 111: // Up-Arrow
        key = 'Up-Arrow';
        break;
      case 114: // Right-Arrow
        break;
      case 116: // Down-Arrow
        key = 'Down-Arrow';
        break;
      case 119: // Delete
        key = 'Delete';
        break;

      default:
        key = String.fromCodePoint(Gdk.keyval_to_unicode(keyVal));
    }

    if (key) {
      DesignCore.CommandLine.handleKeys(key);
    }
  }
});
