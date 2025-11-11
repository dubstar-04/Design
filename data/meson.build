desktop_file = i18n.merge_file(
  input: 'io.github.dubstar_04.design.desktop',
  output: 'io.github.dubstar_04.design.desktop',
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
        'ui/export.blp',
        'ui/preferences/preferencesDialog.blp',
        'ui/preferences/preferencePageSettings.blp',
        'ui/preferences/preferencePageDimensionStyle.blp',
        'ui/preferences/preferencePageLineType.blp',
        'ui/preferences/preferencePageTextStyle.blp',
        'ui/widgets/preferenceRow.blp',
        'ui/layers/layersWindow.blp',
        'ui/properties/propertiesWindow.blp'
    ),
    output: '.',
    command: [find_program('blueprint-compiler'), 'batch-compile', '@OUTPUT@', '@CURRENT_SOURCE_DIR@', '@INPUT@']
)

data_res = gnome.compile_resources('io.github.dubstar_04.design.data',
  'io.github.dubstar_04.design.data.gresource.xml',
  gresource_bundle: true,
  dependencies: blueprints,
  install: true,
  install_dir: pkgdatadir,
)

appstream_file = i18n.merge_file(
  input: 'io.github.dubstar_04.design.metainfo.xml',
  output: 'io.github.dubstar_04.design.metainfo.xml',
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

install_data('io.github.dubstar_04.design.gschema.xml',
  install_dir: join_paths(get_option('datadir'), 'glib-2.0/schemas')
)

compile_schemas = find_program('glib-compile-schemas', required: false)
if compile_schemas.found()
  test('Validate schema file', compile_schemas,
    args: ['--strict', '--dry-run', meson.current_source_dir()]
  )
endif

subdir('icons')
