desktop_file = i18n.merge_file(
  input: 'wood.dan.design.desktop.in',
  output: 'wood.dan.design.desktop',
  type: 'desktop',
  po_dir: '../po',
  install: true,
  install_dir: join_paths(get_option('datadir'), 'applications')
)

desktop_utils = find_program('desktop-file-validate', required: false)
if desktop_utils.found()
  test('Validate desktop file', desktop_utils,
    args: [desktop_file]
  )
endif

pkgdatadir = join_paths(get_option('datadir'), meson.project_name())

blueprints = custom_target('blueprints',
    input: files(
        'ui/window.blp',
        'ui/shortcuts.blp',
        'ui/preferences.blp'
    ),
    output: '.',
    command: [find_program('blueprint-compiler'), 'batch-compile', '@OUTPUT@', '@CURRENT_SOURCE_DIR@', '@INPUT@']
)

data_res = gnome.compile_resources('wood.dan.design.data',
  'wood.dan.design.data.gresource.xml',
  gresource_bundle: true,
  dependencies: blueprints,
  install: true,
  install_dir: pkgdatadir,
)

appstream_file = i18n.merge_file(
  input: 'wood.dan.design.appdata.xml.in',
  output: 'wood.dan.design.appdata.xml',
  po_dir: '../po',
  install: true,
  install_dir: join_paths(get_option('datadir'), 'appdata')
)

appstream_util = find_program('appstream-util', required: false)
if appstream_util.found()
  test('Validate appstream file', appstream_util,
    args: ['validate', appstream_file]
  )
endif

install_data('wood.dan.design.gschema.xml',
  install_dir: join_paths(get_option('datadir'), 'glib-2.0/schemas')
)

compile_schemas = find_program('glib-compile-schemas', required: false)
if compile_schemas.found()
  test('Validate schema file', compile_schemas,
    args: ['--strict', '--dry-run', meson.current_source_dir()]
  )
endif

subdir('icons')
