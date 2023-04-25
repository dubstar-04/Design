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

import {DesignWindow} from './window.js';

pkg.initGettext();
pkg.initFormat();

export const DesignApplication = GObject.registerClass(
    class DesignApplication extends Adw.Application {
      constructor() {
        super({application_id: 'io.github.dubstar_04.design', flags: Gio.ApplicationFlags.HANDLES_OPEN});

        const quitAction = new Gio.SimpleAction({name: 'quit'});
        quitAction.connect('activate', (action) => {
          this.quit();
        });
        this.add_action(quitAction);
        this.set_accels_for_action('app.quit', ['<primary>q']);

        const showAboutAction = new Gio.SimpleAction({name: 'about'});
        showAboutAction.connect('activate', (action) => {
          const aboutParams = {
            developer_name: 'Daniel Wood',
            developers: [
              'Sonny Piers',
              'Brett Parker',
            ],
            artists: [
              'Brage Fuglseth',
            ],
            // TRANSLATORS: eg. 'Translator Name <your.email@domain.com>' or 'Translator Name https://website.example'
            translator_credits: _('translator-credits'),
            transient_for: this.activeWindow,
            modal: true,
            version: pkg.version,
            application_name: 'Design',
            application_icon: 'io.github.dubstar_04.design',
            copyright: 'Copyright 2023 Daniel Wood',
            issue_url: 'https://github.com/dubstar-04/Design/issues/new',
            license_type: Gtk.License.GPL_3_0,
          };
          const aboutDialog = new Adw.AboutWindow(aboutParams);
          aboutDialog.present();
        });

        this.add_action(showAboutAction);

        // open signal only emitted if files are passed as argv. See activate signal.
        this.connect('open', (self, files) => {
          const activeWindow = new DesignWindow(this);
          files.forEach((file) => {
            activeWindow.load_file(file);
          });
          activeWindow.present();
        });

        // activate signal only emitted if no files are passed as argv
        this.connect('activate', () => {
          const activeWindow = new DesignWindow(this);
          activeWindow.present();
        });
      }
    },
);

export function main(argv) {
  const application = new DesignApplication();
  return application.runAsync(argv);
}
