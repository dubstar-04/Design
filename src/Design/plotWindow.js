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

/** Scale label → numeric value (or 'fit' sentinel). */
const scaleMap = {
  'Fit': null,
  '1:1': 1,
  '1:2': 0.5,
  '1:5': 0.2,
  '1:10': 0.1,
  '2:1': 2,
  '5:1': 5,
};

/** Plot style label → RendererBase.Styles transform. */
const styleMap = {
  'None': RendererBase.Styles.NONE,
  'Monochrome': RendererBase.Styles.MONOCHROME,
  'Greyscale': RendererBase.Styles.GREYSCALE,
};

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

    this.present();
  }

  /** Build the options object from the current combo-row selections. */
  #buildOptions() {
    const sizeName = this._pageSize.model.get_string(this._pageSize.selected);
    const pageSize = Constants.PageSizes[sizeName];
    const isLandscape = this._orientation.selected === 1;

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;

    const scaleLabel = this._plotScale.model.get_string(this._plotScale.selected);
    const plotScale = scaleMap[scaleLabel] ?? null;

    const plotAreaLabel = this._plotArea.model.get_string(this._plotArea.selected);
    const plotArea = plotAreaLabel === 'Display' ? PlotOptions.Area.DISPLAY : PlotOptions.Area.EXTENTS;

    const styleLabel = this._plotStyle.model.get_string(this._plotStyle.selected);
    const style = styleMap[styleLabel] ?? RendererBase.Styles.NONE;

    const fileTypeLabel = this._fileType.model.get_string(this._fileType.selected);
    const fileType = fileTypeLabel.toLowerCase();

    // Construct the options object
    const options = new PlotOptions(pageWidth, pageHeight);
    options.setOption('plotScale', plotScale);
    options.setOption('plotArea', plotArea);
    options.setOption('style', style);
    options.setOption('fileType', fileType);

    return options;
  }

  onExportClicked() {
    const mainWindow = this.get_transient_for();
    FileIO.exportPlot(mainWindow, this.#buildOptions());
    this.close();
  }
});
