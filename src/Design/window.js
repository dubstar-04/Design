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
import Gdk from 'gi://Gdk';

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
    'unsaved': GObject.ParamSpec.boolean(
        'unsaved',
        'Unsaved',
        'Whether the current file has unsaved changes',
        GObject.ParamFlags.READWRITE,
        false,
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
    // this.connect('close-request', this.onCloseRequest.bind(this));

    // Connect to close-page signal to handle tab close confirmation
    // this._tabView.connect('close-page', this.onTabCloseRequest.bind(this));

    // Add CSS styling for draft indicator
    this.addCssStyling();

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

  addCssStyling() {
    const cssProvider = new Gtk.CssProvider();
    const css = `
      .draft-subtitle {
        color: #888888;
        font-style: italic;
      }
    `;
    cssProvider.load_from_data(css, css.length);
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
    );
  }

  openHelp() {
    const uri = 'https://design-app.readthedocs.io/en/latest/index.html';
    Gio.AppInfo.launch_default_for_uri_async(uri, null, null, null);
  }

  onTabChange() {
    // activate the tabs canvas
    this.getActiveCanvas().activate();

    // Ensure the settings are synced to the selected tab
    this.settings.syncSettings();

    // // Update unsaved state based on active canvas
    // this.updateUnsavedState();

    // Update tab icons for all tabs
    // this.updateAllTabIcons();

    if (this.layersWindow) {
      this.layersWindow.reload();
    }

    if (this.propertiesWindow) {
      this.propertiesWindow.reload();
    }
  }

  // onTabCloseRequest(tabView, page) {
  //   // This method is called when a tab close is requested
  //   // We need to check for unsaved changes and confirm or deny the close
  //   const canvas = page.get_child();

  //   if (canvas && canvas.getUnsaved && canvas.getUnsaved()) {
  //     // Has unsaved changes, show confirmation dialog
  //     this.showTabCloseConfirmationDialog(page, canvas);
  //     // Return true to indicate we're handling the close request
  //     return true;
  //   } else {
  //     // No unsaved changes, allow the close immediately
  //     this._tabView.close_page_finish(page, true);
  //     return true;
  //   }
  // }

  // updateUnsavedState(canvas) {
  //   // If canvas is provided, update that specific canvas's tab icon
  //   if (canvas) {
  //     this.updateTabIcon(canvas);
  //   }

  //   const activeCanvas = this.getActiveCanvas();
  //   if (activeCanvas) {
  //     this.unsaved = activeCanvas.getUnsaved();
  //   } else {
  //     this.unsaved = false;
  //   }
  // }

  setPageIconForUnsavedState(page, canvas) {
    if (canvas.getUnsaved()) {
      const icon = Gio.ThemedIcon.new('document-modified-symbolic');
      page.set_icon(icon);
    } else {
      // Remove icon for saved files
      page.set_icon(null);
    }
  }

  // updateTabIcon(canvas) {
  //   // Find the tab page for this canvas
  //   const pageCount = this._tabView.get_n_pages();
  //   for (let i = 0; i < pageCount; i++) {
  //     const page = this._tabView.get_nth_page(i);
  //     if (page.get_child() === canvas) {
  //       this.setPageIconForUnsavedState(page, canvas);
  //       break;
  //     }
  //   }
  // }

  // updateAllTabIcons() {
  //   // Update icons for all tabs
  //   const pageCount = this._tabView.get_n_pages();
  //   for (let i = 0; i < pageCount; i++) {
  //     const page = this._tabView.get_nth_page(i);
  //     const canvas = page.get_child();
  //     if (canvas && canvas.getUnsaved) {
  //       this.setPageIconForUnsavedState(page, canvas);
  //     }
  //   }
  // }

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
    // canvas.connect('notify::unsaved', (canvas) => this.updateUnsavedState(canvas));
    this.commandLine.reset();
    // make the new page current
    this._tabView.set_selected_page(page);
    this.settings.syncSettings();

    // // Mark new canvas as unsaved if it's a new document
    // if (!name) {
    //  canvas.markUnsaved();
    // }

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
        return { isOpen: true, page: page };
      }
    }
    return { isOpen: false, page: null };
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
    log('show export window');
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

  // hasUnsavedChanges() {
  //   // Check if any tab has unsaved changes
  //   const pageCount = this._tabView.get_n_pages();
  //   for (let i = 0; i < pageCount; i++) {
  //     const page = this._tabView.get_nth_page(i);
  //     const canvas = page.get_child();
  //     if (canvas && canvas.getUnsaved && canvas.getUnsaved()) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  // onCloseRequest() {
  //   // Check if there are any unsaved changes
  //   if (this.hasUnsavedChanges()) {
  //     this.showCloseConfirmationDialog();
  //     return true; // Prevent default close behavior
  //   }

  //   // If this is an application quit, quit the application
  //   if (this._isApplicationQuit) {
  //     this.get_application().quit();
  //   }


  //   // If this is an application quit, quit the application
  //   if (this._isApplicationQuit) {
  //     this.get_application().quit();
  //   }

  //   return false; // Allow default close behavior
  // }

  // showCloseConfirmationDialog() {
  //   const dialog = new Adw.MessageDialog({
  //     heading: _('Unsaved Changes'),
  //     body: _('You have unsaved changes. Do you want to save them before closing?'),
  //     transient_for: this,
  //     modal: true,
  //   });

  //   // Add response buttons
  //   dialog.add_response('cancel', _('_Cancel'));
  //   dialog.add_response('discard', _('_Discard Changes'));
  //   dialog.add_response('save', _('_Save'));

  //   // Set button appearances
  //   dialog.set_response_appearance('discard', Adw.ResponseAppearance.DESTRUCTIVE);
  //   dialog.set_response_appearance('save', Adw.ResponseAppearance.SUGGESTED);

  //   // Set default and close responses
  //   dialog.set_default_response('save');
  //   dialog.set_close_response('cancel');

  //   // Connect to response signal
  //   dialog.connect('response', (dialog, response) => {
  //     if (response === 'save') {
  //       // Save all unsaved changes
  //       this.saveAllUnsavedChanges();
  //       // Don't close here - let saveTabsSequentially handle it
  //     } else if (response === 'discard') {
  //       // Discard changes and close
  //       if (this._isApplicationQuit) {
  //         this.get_application().quit();
  //       } else {
  //         this.destroy();
  //       }
  //     }
  //     // If response is 'cancel', do nothing (dialog will close)
  //   });

  //   dialog.present();
  // }

  // saveAllUnsavedChanges() {
  //   // Collect all unsaved tabs
  //   const unsavedTabs = [];
  //   const pageCount = this._tabView.get_n_pages();

  //   for (let i = 0; i < pageCount; i++) {
  //     const page = this._tabView.get_nth_page(i);
  //     const canvas = page.get_child();
  //     if (canvas && canvas.getUnsaved && canvas.getUnsaved()) {
  //       unsavedTabs.push({ page, canvas });
  //     }
  //   }

  //   if (unsavedTabs.length === 0) {
  //     return;
  //   }

  //   // Save tabs one by one, showing dialogs for new files
  //   this.saveTabsSequentially(unsavedTabs, 0);
  // }

  // saveTabsSequentially(unsavedTabs, index) {
  //   if (index >= unsavedTabs.length) {
  //     console.log('All tabs saved');
  //     if (this._isApplicationQuit) {
  //       console.log('Quitting application');
  //       this.get_application().quit();
  //     } else {
  //       console.log('Closing window');
  //       this.destroy();
  //     }
  //     return;
  //   }

  //   const { page, canvas } = unsavedTabs[index];
  //   console.log(`Saving tab ${index + 1}/${unsavedTabs.length}: ${page.get_title()}`);

  //   const filePath = canvas.getFilePath();
  //   if (filePath) {
  //     // Existing file - save directly
  //     this.saveExistingFileForClose(canvas);
  //     // Continue with next tab
  //     this.saveTabsSequentially(unsavedTabs, index + 1);
  //   } else {
  //     // New file - show save dialog
  //     this.showSaveDialogForClose(canvas, page, unsavedTabs, index);
  //   }
  // }

  // showSaveDialogForClose(canvas, page, unsavedTabs, index) {
  //   // Switch to the tab we want to save
  //   this._tabView.set_selected_page(page);
  //   const filter = new Gtk.FileFilter();
  //   filter.add_pattern('*.dxf');

  //   const dialog = new Gtk.FileChooserNative({
  //     action: Gtk.FileChooserAction.SAVE,
  //     filter: filter,
  //     select_multiple: false,
  //     transient_for: this,
  //     title: _('Save As'),
  //   });

  //   const name = FileIO.formatFilename(page.get_title());
  //   dialog.set_current_name(`${name}.dxf`);

  //   dialog.show();
  //   dialog.connect('response', (dialog, response) => {
  //     if (response == Gtk.ResponseType.ACCEPT) {
  //       const file = dialog.get_file();
  //       const filePath = file.get_path();

  //       // Save the file
  //       FileIO.saveFile(filePath, this);

  //       // Update page name and file path
  //       const info = file.query_info('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
  //       const fileName = info.get_name();
  //       const tabTitle = page.get_title();

  //       // Set the active file path
  //       canvas.setFilePath(filePath);
  //       // // Mark as saved since we just saved it
  //       // canvas.markSaved();

  //       if (fileName !== tabTitle) {
  //         page.set_title(fileName);
  //       }

  //       console.log(`Tab ${index + 1} saved successfully`);
  //       // Continue with next tab
  //       this.saveTabsSequentially(unsavedTabs, index + 1);
  //     } else {
  //       // User cancelled - don't close the application
  //       console.log('Save cancelled, keeping application open');
  //       // Don't call destroy() - keep the application open
  //     }
  //   });
  // }

  // saveExistingFileForClose(canvas) {
  //   // Remember the currently active canvas
  //   const currentCanvas = this.getActiveCanvas();
  //   console.log(`Saving existing file: ${canvas.getFilePath()}`);

  //   // Activate the canvas we want to save
  //   canvas.activate();

  //   // Save the file
  //   this.saveFileToPath(canvas.getFilePath(), canvas);

  //   // Reactivate the previously active canvas
  //   if (currentCanvas && currentCanvas !== canvas) {
  //     currentCanvas.activate();
  //   }
  //   console.log('File saved successfully');
  // }


  // showTabCloseConfirmationDialog(page, canvas) {
  //   const dialog = new Adw.MessageDialog({
  //     heading: _('Unsaved Changes'),
  //     body: _('This tab has unsaved changes. Do you want to save them before closing?'),
  //     transient_for: this,
  //     modal: true,
  //   });

  //   // Add response buttons
  //   dialog.add_response('cancel', _('_Cancel'));
  //   dialog.add_response('discard', _('_Discard Changes'));
  //   dialog.add_response('save', _('_Save'));

  //   // Set button appearances
  //   dialog.set_response_appearance('discard', Adw.ResponseAppearance.DESTRUCTIVE);
  //   dialog.set_response_appearance('save', Adw.ResponseAppearance.SUGGESTED);

  //   // Set default and close responses
  //   dialog.set_default_response('save');
  //   dialog.set_close_response('cancel');

  //   // Connect to response signal
  //   dialog.connect('response', (dialog, response) => {
  //     if (response === 'save') {
  //       // Save the specific canvas that's being closed
  //       this.saveCanvas(canvas, page);
  //     } else if (response === 'discard') {
  //       // Discard changes and close the tab
  //       this._tabView.close_page_finish(page, true);
  //     } else {
  //       // Cancel - don't close the tab
  //       this._tabView.close_page_finish(page, false);
  //     }
  //   });

  //   dialog.present();
  // }

  // saveCanvas(canvas, page) {
  //   const filePath = canvas.getFilePath();
  //   if (filePath) {
  //     // For existing files, save directly and close
  //     this.saveExistingFile(canvas, page);
  //   } else {
  //     // For new files, show save dialog but don't close yet
  //     this.showSaveDialogForNewFile(canvas, page);
  //   }
  // }

  // async saveExistingFile(canvas, page) {
  //   // Remember the currently active canvas
  //   const currentCanvas = this.getActiveCanvas();

  //   // Activate the canvas we want to save
  //   canvas.activate();

  //   // Save the file
  //   await this.saveFileToPath(canvas.getFilePath(), canvas);

  //   // Reactivate the previously active canvas
  //   if (currentCanvas && currentCanvas !== canvas) {
  //     currentCanvas.activate();
  //   }

  //   // Close the tab
  //   this._tabView.close_page_finish(page, true);
  // }

  // showSaveDialogForNewFile(canvas, page) {
  //   // Find the page that contains our canvas
  //   const pageCount = this._tabView.get_n_pages();
  //   let targetPage = null;
  //   for (let i = 0; i < pageCount; i++) {
  //     const page = this._tabView.get_nth_page(i);
  //     if (page.get_child() === canvas) {
  //       targetPage = page;
  //       break;
  //     }
  //   }

  //   if (targetPage) {
  //     // Switch to the target tab
  //     this._tabView.set_selected_page(targetPage);

  //     // Show the save dialog with a callback to close the tab when done
  //     this.showSaveDialogWithCallback(() => {
  //       // Close the tab after save is complete
  //       this._tabView.close_page_finish(page, true);
  //     });
  //   }
  // }

  // showSaveDialogWithCallback(onComplete) {
  //   const filter = new Gtk.FileFilter();
  //   filter.add_pattern('*.dxf');

  //   const dialog = new Gtk.FileChooserNative({
  //     action: Gtk.FileChooserAction.SAVE,
  //     filter: filter,
  //     select_multiple: false,
  //     transient_for: this,
  //     title: _('Save As'),
  //   });

  //   const name = FileIO.formatFilename(this._tabView.get_selected_page().get_title());
  //   dialog.set_current_name(`${name}.dxf`);

  //   dialog.show();
  //   dialog.connect('response', (dialog, response) => {
  //     if (response == Gtk.ResponseType.ACCEPT) {
  //       const file = dialog.get_file();
  //       const filePath = file.get_path();

  //       // Save the file
  //       FileIO.saveFile(filePath, this);

  //       // Update page name and file path
  //       const info = file.query_info('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
  //       const fileName = info.get_name();
  //       const tabTitle = this._tabView.get_selected_page().get_title();

  //       // Set the active file path
  //       this.getActiveCanvas().setFilePath(filePath);
  //       // // Mark as saved since we just saved it
  //       // this.getActiveCanvas().markSaved();

  //       if (fileName !== tabTitle) {
  //         const page = this._tabView.get_selected_page();
  //         page.set_title(fileName);
  //       }

  //       // Call the completion callback to close the tab
  //       if (onComplete) {
  //         onComplete();
  //       }
  //     } else {
  //       // User cancelled, don't close the tab
  //       // The tab close request was already denied by returning false
  //       this._tabView.close_page_finish(this._tabView.get_selected_page(), false);
  //     }
  //   });
  // }


  // saveFileToPath(filePath, canvas) {
  //   if (filePath) {
  //     const file = Gio.File.new_for_path(filePath);
  //     const dxfContents = canvas.core.saveFile();
  //     const [success] = file.replace_contents(dxfContents, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);

  //     if (success) {
  //       // // Mark canvas as saved
  //       // canvas.markSaved();
  //       DesignCore.Core.notify(_('File Saved'));
  //     } else {
  //       DesignCore.Core.notify(_('Error Saving File'));
  //     }
  //   }
  // }
});
