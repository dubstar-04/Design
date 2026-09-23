/* PlotWindow.js
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

import { Constants } from '../Design-Core/core/lib/constants.js';
import { PlotOptions } from '../Design-Core/core/lib/plotOptions.js';
import { RendererBase } from '../Design-Core/core/lib/renderers/rendererBase.js';
import { FileIO } from './fileIO.js';

import { DesignCore } from '../Design-Core/core/designCore.js';

// PageSizes/pageWidth/pageHeight are in PDF points (1 point = 25.4/72 mm); drawing units are assumed to be millimetres
const MM_TO_POINTS = 72 / 25.4;

/** Scale values by index, matching plot.blp order: Fit, 1:1, 1:2, 1:5, 1:10, 2:1, 5:1
 * Ratios are converted to PDF points per drawing unit so "1:1" prints at true mm size. */
const scaleValues = [null, MM_TO_POINTS, MM_TO_POINTS * 0.5, MM_TO_POINTS * 0.2, MM_TO_POINTS * 0.1, MM_TO_POINTS * 2, MM_TO_POINTS * 5];

/** File type values by index, matching plot.blp order: PDF, SVG */
const fileTypeValues = ['pdf', 'svg'];

/** Plot style values by index, matching plot.blp order: None, Monochrome, Greyscale */
const styleValues = [
  RendererBase.Styles.NONE,
  RendererBase.Styles.MONOCHROME,
  RendererBase.Styles.GREYSCALE,
];

export const PlotWindow = GObject.registerClass({
  GTypeName: 'PlotWindow',
  Template: 'resource:///io/github/dubstar_04/design/ui/plot.ui',
  InternalChildren: ['pageSize', 'orientation', 'plotArea', 'plotScale', 'plotStyle', 'fileType'],
}, class PlotWindow extends Adw.Window {
  show() {
    // Populate page size combo from Constants.PageSizes keys
    const sizeNames = Object.keys(Constants.PageSizes);
    this._pageSize.model = new Gtk.StringList({ strings: sizeNames });
    this._pageSize.selected = 0;

    // Default to Landscape (index 1)
    this._orientation.selected = 1;

    // picked window corners, set once the user completes a Window area pick
    this._windowArea = null;

    this.present();
  }

  /**
   * Handle plotArea selection changes.
   * When "Window" (index 2) is selected, hide the dialog and let the user
   * pick two corners on the canvas, then restore the dialog.
   */
  async onPlotAreaChanged() {
    const isWindow = this._plotArea.selected === 2; // matches plot.blp order: Extents, Display, Window
    if (!isWindow) {
      this._windowArea = null;
      return;
    }

    this.hide();

    const inputManager = DesignCore.Scene.inputManager;
    inputManager.reset();

    const tool = DesignCore.CommandManager.createNew('PlotWindowPick');
    inputManager.activeCommand = tool;
    await tool.execute();

    if (tool.points.length === 2) {
      this._windowArea = { point1: tool.points[0], point2: tool.points[1] };
    } else {
      // picking was cancelled — fall back to Extents
      this._windowArea = null;
      this._plotArea.selected = 0;
    }

    // Re-showing the dialog can steal the pointer grab mid-click before the canvas
    // sees a mouseUp; inputManager.reset() clears any state that leaves stuck
    inputManager.reset();

    this.present();
  }

  /** Build the options object from the current combo-row selections. */
  #buildOptions() {
    const sizeName = this._pageSize.model.get_string(this._pageSize.selected);
    const pageSize = Constants.PageSizes[sizeName];
    const isLandscape = this._orientation.selected === 1;

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;

    const plotScale = scaleValues[this._plotScale.selected] ?? null;

    // plotArea: 0=Extents, 1=Display, 2=Window (matches plot.blp order)
    let plotArea = PlotOptions.Area.EXTENTS;
    if (this._plotArea.selected === 1) plotArea = PlotOptions.Area.DISPLAY;
    if (this._plotArea.selected === 2) plotArea = PlotOptions.Area.WINDOW;

    const style = styleValues[this._plotStyle.selected] ?? RendererBase.Styles.NONE;

    const fileType = fileTypeValues[this._fileType.selected] ?? 'pdf';

    // Construct the options object
    const options = new PlotOptions(pageWidth, pageHeight);
    options.setOption('plotScale', plotScale);
    options.setOption('plotArea', plotArea);
    options.setOption('windowArea', plotArea === PlotOptions.Area.WINDOW ? this._windowArea : null);
    // a precisely picked window shouldn't get the default page margin shrinking it further
    options.setOption('margin', plotArea === PlotOptions.Area.WINDOW ? 0 : 40);
    options.setOption('style', style);
    options.setOption('fileType', fileType);

    return options;
  }

  onExportClicked() {
    if (this._plotArea.selected === 2 && !this._windowArea) {
      DesignCore.Core.notify(_('Specify a plot window first'));
      return;
    }

    const mainWindow = this.get_transient_for();
    FileIO.exportPlot(mainWindow, this.#buildOptions());
    this.close();
  }
});
