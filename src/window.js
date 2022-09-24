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
import Cairo from 'cairo';
import * as CanvasObj from './js/lib/canvas.js'

export const DesignWindow = GObject.registerClass({
    GTypeName: 'DesignWindow',
    Template: 'resource:///wood/dan/design/window.cmb.ui',
    InternalChildren: ['drawingArea'],
}, class DesignWindow extends Gtk.ApplicationWindow {
    _init(application) {
        super._init({ application });

        this._drawingArea.set_draw_func(this._on_draw);

        this._canvas =  new CanvasObj.Canvas(this._drawingArea);

        
    }

    _on_draw(area, cr, width, height) {

        cr.setLineWidth(5.0);
        cr.setSourceRGB(0.8, 0.0, 0.0);

        //cr.setStrokeStyle();

        cr.moveTo(0, height/2);
        cr.lineTo(width, height/2);
 
        cr.stroke();
        
        cr.$dispose();

        console.log('size', this._canvas.canvasSize())
        
    }
    
}

);



