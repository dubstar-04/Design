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
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw?version=1';

import { Canvas } from './canvas.js'
import { CommandLine } from './commandLine.js'
import { PreferencesWindow } from './preferencesWindow.js'
import { LayersWindow } from './layersWindow.js'
import { PropertiesWindow } from './propertiesWindow.js'

export const DesignWindow = GObject.registerClass({
  GTypeName: 'DesignWindow',
  Signals: {
    'canvas-selection-updated': {},
  },
  Template: 'resource:///wood/dan/design/ui/window.ui',
  InternalChildren: ['tabView', 'mousePosLabel', 'commandLineEntry', 'newButton', 'entitiesToolbar', 'toolsToolbar'],
}, class DesignWindow extends Adw.ApplicationWindow {
  _init(application) {
    super._init({ application });

    const open = new Gio.SimpleAction({
      name: "open",
      parameter_type: null,
    });
    open.connect("activate", this.openDialog.bind(this));
    this.add_action(open);

    const save = new Gio.SimpleAction({
      name: "save",
      parameter_type: null,
    });
    save.connect("activate", this.saveDialog.bind(this));
    this.add_action(save);

    const preferences = new Gio.SimpleAction({
      name: "preferences",
      parameter_type: null,
    });
    preferences.connect("activate", this.show_preferences_window.bind(this));
    application.add_action(preferences);

    const shortcuts = new Gio.SimpleAction({
      name: "shortcuts",
      parameter_type: null,
    });
    shortcuts.connect("activate", this.show_shortcuts_window.bind(this));
    this.add_action(shortcuts);

    this._newButton.connect('clicked', this.new_document.bind(this));
    this.add_canvas();
    this._commandLineEntry.set_parent(this)
    this.load_toolbars();
  } //init

  new_document() {
    this.add_canvas()
  }

  add_canvas(name) {
    // setup empty new canvas
    var canvas = new Canvas()
    var page = this._tabView.add_page(canvas, null);
    var tabname = name || 'new'
    page.set_title(tabname);
    canvas.connect('commandline-updated', this.update_commandline.bind(this))
    canvas.connect('mouseposition-updated', this.update_mouse_position.bind(this))
    canvas.connect('selection-updated', this.canvas_selection_updated.bind(this))
    canvas.init(this._commandLineEntry)
  }

  load_toolbars(){
    const commands = this.get_active_canvas().core.commandManager.getCommands();

    for (const command in commands) {

      const design_command = commands[command]
      
      if (Object.hasOwn(design_command, 'type') && Object.hasOwn(design_command, 'shortcut')){

        const command_name = design_command.command.toLowerCase()

        let button = new Gtk.Button({
          icon_name: `${command_name}-symbolic`,
          valign: Gtk.Align.CENTER,
          halign: Gtk.Align.CENTER,
          width_request: 32,
          height_request: 32,
          margin_top: 5,
          margin_bottom: 5,
          css_classes:  ['flat'],
          //TODO: Make first letter of command_name uppercase - possible to add more info?
          tooltip_text: `${command_name} (${design_command.shortcut})`
        });

        button.connect('clicked', this.toolbar_button_press.bind(this, design_command.shortcut));

        if (design_command.type === 'Entity'){
          this._entitiesToolbar.append(button);
        }

        if (design_command.type === 'Tool'){
          this._toolsToolbar.append(button);
        }
    }
    }

  }

  toolbar_button_press(command){
    this.get_active_canvas().core.designEngine.sceneControl('Enter', [`${command}`])
  }

  show_shortcuts_window() {
    var shortcuts_win = Gtk.Builder.new_from_resource('/wood/dan/design/ui/shortcuts.ui').get_object('shortcuts')
    shortcuts_win.set_transient_for(this)
    shortcuts_win.present()
  }

  show_preferences_window() {
    var preferences_win = new PreferencesWindow();
    preferences_win.set_transient_for(this)
    preferences_win.present()
  }

  show_layers_window() {
    console.log("Show Layers Window")
    var layers_win = new LayersWindow(this);
    layers_win.set_transient_for(this)
    layers_win.present()
  }

  show_properties_window() {
    console.log("Show Properties Window")
    var properties_win = new PropertiesWindow(this);
    properties_win.set_transient_for(this)
    properties_win.present()
  }

  update_commandline(canvas, commandLineValue) {
    this._commandLineEntry.text = commandLineValue;
  }

  update_mouse_position(canvas, position) {
    this._mousePosLabel.label = position
  }

  canvas_selection_updated(){
    this.emit('canvas-selection-updated')
  }

  get_active_canvas() {
    var activePage = this._tabView.get_selected_page()
    var activeCanvas = activePage.get_child()
    return activeCanvas
  }

  openDialog() {
    log("Open File")

    var action = Gtk.FileChooserAction.OPEN

    var filter = new Gtk.FileFilter();
    filter.add_pattern('*.dxf')

    var dialog = new Gtk.FileChooserDialog({
      action: Gtk.FileChooserAction.OPEN,
      filter: filter,
      select_multiple: false,
      transient_for: this,
      title: 'Open'
    });

    dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
    dialog.add_button('OK', Gtk.ResponseType.OK);

    dialog.show()
    dialog.connect("response", this.openFile.bind(this))
  };

  openFile(dialog, response) {

    log("openFile")

    if (response == Gtk.ResponseType.OK) {
      var file = dialog.get_file();
      dialog.destroy()
      const [, contents, etag] = file.load_contents(null);
      const decoder = new TextDecoder('utf-8');
      // decode the file contents from a bitearray
      const contentsString = decoder.decode(contents);
      // get filename
      const info = file.query_info('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
      // create a new canvas with the filename in the tab
      this.add_canvas(info.get_name())
      // load the file contents into the canvas
      this.get_active_canvas().core.openFile(contentsString)
    }

    dialog.destroy()
  }


  saveDialog() {
    log("save File dialog")

    var action = Gtk.FileChooserAction.SAVE

    var filter = new Gtk.FileFilter();
    filter.add_pattern('*.dxf')

    var dialog = new Gtk.FileChooserDialog({
      action: Gtk.FileChooserAction.SAVE,
      filter: filter,
      select_multiple: false,
      transient_for: this,
      title: 'Save As'
    });

    dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
    dialog.add_button('Save', Gtk.ResponseType.ACCEPT);

    dialog.show()
    dialog.connect("response", this.saveFile.bind(this))
  };

  saveFile(dialog, response) {

    log("save File")
    log(dialog)
    log(response)

    if (response == Gtk.ResponseType.ACCEPT) {
      log("Save clicked:")
      var file = dialog.get_file();

      // Synchronous, blocking method
      const outputStream = file.create(Gio.FileCreateFlags.NONE, null);

      const dxfContents = this.get_active_canvas().core.saveFile();

      const [, etag] = file.replace_contents(dxfContents, null, false,
        Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    }

    dialog.destroy()
  }
}

);




