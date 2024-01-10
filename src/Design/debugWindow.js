/* DebugWindow.js
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
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Colours} from '../Design-Core/core/lib/colours.js';
import {DesignCore} from '../Design-Core/core/designCore.js';

export const DebugWindow = GObject.registerClass({
  GTypeName: 'DebugWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/debugWindow.ui',
  InternalChildren: ['textView'],
}, class DebugWindow extends Adw.ApplicationWindow {
  constructor() {
    super({});
  }

  show() {
    this.present();
    this.reload();
  }

  reload() {
    const buffer = new Gtk.TextBuffer(); // this._textView.get_buffer();
    const string = 'hey';
    buffer.set_text(string, string.length);

    this._textView.set_buffer(buffer);
  }
}, // window
);


