/* main.js
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
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';

import { DesignWindow } from './window.js';

pkg.initGettext();
pkg.initFormat();

export const DesignApplication = GObject.registerClass(
    class DesignApplication extends Adw.Application {
        constructor() {
            super({ application_id: 'wood.dan.design', flags: Gio.ApplicationFlags.FLAGS_NONE });

            const quit_action = new Gio.SimpleAction({ name: 'quit' });
            quit_action.connect('activate', action => {
                this.quit();
            });
            this.add_action(quit_action);
            this.set_accels_for_action('app.quit', ['<primary>q']);

            const show_about_action = new Gio.SimpleAction({ name: 'about' });
            show_about_action.connect('activate', action => {
                let aboutParams = {
                    developers: [
                        'Daniel Wood'
                    ],
                    transient_for: this.active_window,
                    modal: true,
                    version: pkg.version,
                    application_name: 'Design',
                    application_icon: "wood.dan.design",
                    copyright: "Copyright 2023 Daniel Wood",
                    issue_url: 'https://github.com/dubstar-04/Design/issues/new',
                    license_type: Gtk.License.GPL_3_0,
                };
                const aboutDialog = new Adw.AboutWindow(aboutParams);
                aboutDialog.present();
            });
            this.add_action(show_about_action);
        }

        vfunc_activate() {
            let { active_window } = this;

            if (!active_window)
                active_window = new DesignWindow(this);

            active_window.present();
        }
    }
);

export function main(argv) {
    const application = new DesignApplication();
    return application.run(argv);
}
