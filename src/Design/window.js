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

import { Canvas } from './canvas.js';
import { CommandLine } from './commandLine.js';
import { ExportWindow } from './exportWindow.js';
import { Settings } from './settings.js';
import { FileIO } from './fileIO.js';

import { PropertiesWindow } from './Properties/propertiesWindow.js';
import { LayersWindow } from './Layers/layersWindow.js';
import { PreferencesDialog } from './Preferences/preferencesDialog.js';

import { DesignCore } from '../Design-Core/core/designCore.js';

export const DesignWindow = GObject.registerClass({
  GTypeName: 'DesignWindow',
  Properties: {
    'toolbars-visible': GObject.ParamSpec.boolean(
        'toolbars-visible',
        'Toolbars Visible',
        'Show the input toolbars',
        GObject.ParamFlags.READWRITE,
        true,
    ),
  },
  Signals: {
    'canvas-selection-updated': {},
  },
  Template: 'resource:///io/github/dubstar_04/design/ui/window.ui',
  InternalChildren: ['isModified', 'tabView', 'mousePosLabel', 'commandLineEntry', 'newButton', 'entitiesToolbar', 'toolsToolbar', 'toastoverlay'],
}, class DesignWindow extends Adw.ApplicationWindow {
  constructor(application) {
    super({ application });

    // initialise the application settings
    this.settings = new Settings(this);
    this.commandLine = new CommandLine(this);

    const open = new Gio.SimpleAction({
      name: 'open',
      parameter_type: null,
    });
    open.connect('activate', () => FileIO.openDialog(this));
    this.add_action(open);
    application.set_accels_for_action('win.open', ['<primary>O']);

    const save = new Gio.SimpleAction({
      name: 'save',
      parameter_type: null,
    });
    save.connect('activate', () => FileIO.save(this));
    this.add_action(save);
    application.set_accels_for_action('win.save', ['<primary>S']);

    const saveAs = new Gio.SimpleAction({
      name: 'save-as',
      parameter_type: null,
    });

    saveAs.connect('activate', () => FileIO.saveDialog(this));
    this.add_action(saveAs);
    application.set_accels_for_action('win.save-as', ['<primary><SHIFT>S']);

    const exportFile = new Gio.SimpleAction({
      name: 'export',
      parameter_type: null,
    });
    exportFile.connect('activate', this.showExportWindow.bind(this));
    this.add_action(exportFile);

    const preferences = new Gio.SimpleAction({
      name: 'preferences',
      parameter_type: null,
    });
    preferences.connect('activate', this.showPreferencesDialog.bind(this));
    application.add_action(preferences);
    application.set_accels_for_action('app.preferences', ['<primary>comma']);

    const showLayers = new Gio.SimpleAction({
      name: 'showlayers',
      parameter_type: null,
    });
    showLayers.connect('activate', this.showLayersWindow.bind(this));
    application.add_action(showLayers);
    application.set_accels_for_action('app.showlayers', ['<primary>L']);

    const showProperties = new Gio.SimpleAction({
      name: 'showproperties',
      parameter_type: null,
    });
    showProperties.connect('activate', this.showPropertiesWindow.bind(this));
    application.add_action(showProperties);
    application.set_accels_for_action('app.showproperties', ['<primary>1']);

    const shortcuts = new Gio.SimpleAction({
      name: 'shortcuts',
      parameter_type: null,
    });
    shortcuts.connect('activate', this.showShortcutsWindow.bind(this));
    this.add_action(shortcuts);
    application.set_accels_for_action('win.shortcuts', ['<primary>question']);

    const newDoc = new Gio.SimpleAction({
      name: 'new',
      parameter_type: null,
    });
    newDoc.connect('activate', this.createNewDocument.bind(this));
    this.add_action(newDoc);
    application.set_accels_for_action('win.new', ['<primary>N']);

    const shortcutController = new Gtk.ShortcutController();

    const toggleGridShortcut = new Gtk.Shortcut({ trigger: Gtk.ShortcutTrigger.parse_string('<Primary>G'), action: Gtk.CallbackAction.new(this.settings.onSettingToggled.bind(this.settings, 'drawgrid')) });
    shortcutController.add_shortcut(toggleGridShortcut);

    const helpShortcut = new Gtk.Shortcut({ trigger: Gtk.ShortcutTrigger.parse_string('F1'), action: Gtk.CallbackAction.new(this.openHelp.bind(this)) });
    shortcutController.add_shortcut(helpShortcut);

    const toggleOrthoShortcut = new Gtk.Shortcut({ trigger: Gtk.ShortcutTrigger.parse_string('F8'), action: Gtk.CallbackAction.new(this.settings.onSettingToggled.bind(this.settings, 'ortho')) });
    shortcutController.add_shortcut(toggleOrthoShortcut);

    const toggleSnapShortcut = new Gtk.Shortcut({ trigger: Gtk.ShortcutTrigger.parse_string('F9'), action: Gtk.CallbackAction.new(this.onToggleSnapMode.bind(this)) });
    shortcutController.add_shortcut(toggleSnapShortcut);

    const togglePolarShortcut = new Gtk.Shortcut({ trigger: Gtk.ShortcutTrigger.parse_string('F10'), action: Gtk.CallbackAction.new(this.settings.onSettingToggled.bind(this.settings, 'polar')) });
    shortcutController.add_shortcut(togglePolarShortcut);

    this.add_controller(shortcutController);

    this._tabView.connect('notify::selected-page', this.onTabChange.bind(this));

    // Connect close-request signal to handle unsaved changes
    this.connect('close-request', this.onWindowCloseRequest.bind(this));

    // Connect to close-page signal to handle tab close confirmation
    this._tabView.connect('close-page', this.onTabCloseRequest.bind(this));

    this.addCanvas();
    this.loadToolbars();

    // store a reference to open windows
    // Only show these windows once and update open windows
    this.layersWindow;
    this.propertiesWindow;
    this.exportWindow;
  }

  get toolbars_visible() {
    if (this._toolbars_visible === undefined) {
      this._toolbars_visible = false;
    }

    return this._toolbars_visible;
  }

  set toolbars_visible(value) {
    if (this.toolbars_visible === value) {
      return;
    }

    this._toolbars_visible = value;
    this.notify('toolbars-visible');
  }

  onShowToast(message) {
    const toast = new Adw.Toast({
      title: message,
      timeout: 3,
    });

    // Hide any existing toasts
    this._toastoverlay.dismiss_all();
    // Show the new toast
    this._toastoverlay.add_toast(toast);
  }

  onToggleSnapMode() {
    // TODO: implement snap mode toggle
    this.onShowToast('Snap toggle not implemented');
  }

  onShowToolbars(canvas, show) {
    // show or hide the toolbars and commandline
    // these are only suitable for mouse and keyboard
    // hide on touch
    this.toolbars_visible = show;
  }

  openHelp() {
    const uri = 'https://design-app.readthedocs.io/en/latest/index.html';
    Gio.AppInfo.launch_default_for_uri_async(uri, null, null, null);
  }

  onTabChange() {
    // activate the tabs canvas
    const canvas = this.getActiveCanvas();
    canvas.activate();

    // Ensure the settings are synced to the selected tab
    this.settings.syncSettings();

    // Update unsaved state based on active canvas
    this.updateWindowState(canvas);

    if (this.layersWindow) {
      this.layersWindow.reload();
    }

    if (this.propertiesWindow) {
      this.propertiesWindow.reload();
    }
  }

  onTabCloseRequest(tabView, page) {
    // This method is called when a tab close is requested
    // Check for unsaved changes and confirm or deny the close
    const canvas = page.get_child();

    if (canvas.is_modified) {
      // create a discard action to close the tab
      const discardAction = () => {
        this._tabView.close_page_finish(page, true);
      };
      const cancelAction = () => {
        this._tabView.close_page_finish(page, false);
      };

      this.showCloseConfirmationDialog(discardAction, cancelAction);
      // Return true to indicate the close request is handled
      return true;
    } else {
      return false; // Allow default close behavior
    }
  }

  onWindowCloseRequest() {
    // Check if there are any unsaved changes
    const unsavedChanges = this.hasUnsavedChanges;

    // If there are unsaved changes, show confirmation dialog
    if (unsavedChanges) {
      const discardAction = () => {
        this.get_application().quit();
      };

      const cancelAction = () => {
        // Do nothing, just close the dialog
      };

      this.showCloseConfirmationDialog(discardAction, cancelAction);
      return true; // Prevent default close behavior
    }
    return false; // Allow default close behavior
  }

  saveStateChanged(page, canvas) {
    if (page) {
      if (canvas) {
        const icon = Gio.ThemedIcon.new('document-modified-symbolic');
        page.set_icon(canvas.is_modified ? icon : null);
        this.updateWindowState(canvas);
      }
    }
  }

  updateWindowState(canvas) {
    if (canvas) {
      this._isModified.visible = canvas.is_modified;
    }
  }

  createNewDocument() {
    this.addCanvas();
  }

  addCanvas(name) {
    // Check if the current canvas is empty
    let canvas = this.getActiveCanvas();
    let page = this._tabView.get_selected_page();

    if (!canvas || canvas.core.scene.entities.count() !== 0 || canvas.getFilePath()) {
      // no active canvas
      // canvas is not empty or has a filePath assigned
      // setup empty new canvas
      canvas = new Canvas(this.commandLine);
      page = this._tabView.add_page(canvas, null);
    }

    const tabname = name || 'new';
    page.set_title(tabname);
    canvas.connect('commandline-updated', this.updateCommandline.bind(this));
    canvas.connect('mouseposition-updated', this.updateMousePosition.bind(this));
    canvas.connect('selection-updated', this.canvasSelectionUpdated.bind(this));
    canvas.connect('input-changed', this.onShowToolbars.bind(this));
    canvas.connect('notify::is-modified', this.saveStateChanged.bind(this, page, canvas));
    this.commandLine.reset();
    // make the new page current
    this._tabView.set_selected_page(page);
    this.settings.syncSettings();

    // set the callback function to trigger toasts
    // TODO: would this be better handles in canvas and use a signal?
    canvas.core.setExternalNotifyCallbackFunction(this.onShowToast.bind(this));
  }

  isFileAlreadyOpen(filePath) {
    // Check if a file with the given path is already open in any tab
    const pageCount = this._tabView.get_n_pages();
    for (let i = 0; i < pageCount; i++) {
      const page = this._tabView.get_nth_page(i);
      const canvas = page.get_child();
      if (canvas && canvas.getFilePath() === filePath) {
        return page;
      }
    }
    return null;
  }

  switchToTab(page) {
    // Switch to the specified tab
    this._tabView.set_selected_page(page);
    this.onTabChange();
  }

  loadToolbars() {
    const commands = DesignCore.CommandManager.getCommands();

    for (let index = 0; index < commands.length; index++) {
      const designCommand = commands[index];

      if (designCommand.hasOwnProperty('type') && designCommand.hasOwnProperty('shortcut')) {
        const commandName = designCommand.command.toLowerCase();

        const button = new Gtk.Button({
          icon_name: `${commandName}-symbolic`,
          valign: Gtk.Align.CENTER,
          halign: Gtk.Align.CENTER,
          width_request: 32,
          height_request: 32,
          margin_top: 2,
          margin_bottom: 2,
          css_classes: ['flat'],
          focusable: false,
          // TODO: Make first letter of command_name uppercase - possible to add more info?
          tooltip_text: `${commandName} (${designCommand.shortcut})`,
        });

        button.connect('clicked', this.onToolbarButtonPress.bind(this, designCommand.shortcut));

        if (designCommand.type === 'Entity') {
          this._entitiesToolbar.append(button);
        }

        if (designCommand.type === 'Tool') {
          this._toolsToolbar.append(button);
        }
      }
    }
  }

  onToolbarButtonPress(command) {
    DesignCore.Scene.inputManager.onCommand(`${command}`);
  }

  showShortcutsWindow() {
    const shortcutsWin = Gtk.Builder.new_from_resource('/io/github/dubstar_04/design/ui/shortcuts.ui').get_object('shortcuts');
    shortcutsWin.present(this);
  }

  showPreferencesDialog() {
    const preferencesWin = new PreferencesDialog(this.settings);
    preferencesWin.present(this);
  }

  showLayersWindow() {
    if (!this.layersWindow) {
      this.layersWindow = new LayersWindow(this);
      this.layersWindow.set_transient_for(this);
      this.layersWindow.show();

      this.layersWindow.connect('close-request', ()=>{
        this.layersWindow = null;
      });
    }
  }

  showExportWindow() {
    if (!this.exportWindow) {
      this.exportWindow = new ExportWindow();
      this.exportWindow.set_transient_for(this);
      this.exportWindow.set_modal(true);
      this.exportWindow.show();

      this.exportWindow.connect('close-request', ()=>{
        this.exportWindow = null;
      });
    }
  }

  showPropertiesWindow() {
    if (!this.propertiesWindow) {
      this.propertiesWindow = new PropertiesWindow(this);
      this.propertiesWindow.set_transient_for(this);
      this.propertiesWindow.show();

      const reloadConnection = this.connect('canvas-selection-updated', this.propertiesWindow.reload.bind(this.propertiesWindow));

      this.propertiesWindow.connect('close-request', ()=>{
        this.propertiesWindow = null;
        // disconnect the property window reload
        this.disconnect(reloadConnection);
      });
    }
  }

  updateCommandline(canvas, commandLineValue) {
    this._commandLineEntry.text = commandLineValue;
  }

  updateMousePosition(canvas, position) {
    this._mousePosLabel.label = position;
  }

  canvasSelectionUpdated() {
    this.emit('canvas-selection-updated');
  }

  getActiveCanvas() {
    const activePage = this._tabView.get_selected_page();
    if (activePage) {
      const activeCanvas = activePage.get_child();
      return activeCanvas;
    }
    // no active canvas
    return;
  }

  get hasUnsavedChanges() {
    // Check if any tab has unsaved changes
    const pageCount = this._tabView.get_n_pages();
    for (let i = 0; i < pageCount; i++) {
      const page = this._tabView.get_nth_page(i);
      const canvas = page.get_child();
      if (canvas?.is_modified) return true;
    }
    return false;
  }

  /**
   * Show a confirmation dialog when there are unsaved changes
   * This is shown for tab close and window close
   * @param {Function} discardAction
   */
  showCloseConfirmationDialog(discardAction, cancelAction) {
    const dialog = new Adw.AlertDialog({
      heading: 'Discard Changes?',
      body: 'Unsaved changes will be permanently lost.',
      close_response: 'cancel',
    });

    dialog.add_response('cancel', 'Cancel');
    dialog.add_response('discard', 'Discard Changes');

    // Use DESTRUCTIVE appearance to draw attention to the potentially damaging consequences of this action
    dialog.set_response_appearance('discard', Adw.ResponseAppearance.DESTRUCTIVE);

    dialog.connect('response', (dialog, response) => {
      if (response === 'discard') {
        discardAction();
      } else {
        cancelAction();
      }
    });

    dialog.choose(this, null, null);
  }
});
