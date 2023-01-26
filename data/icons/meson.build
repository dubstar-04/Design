application_id = 'wood.dan.design'

icons = [
  'entities/arc-symbolic.svg',
  'entities/line-symbolic.svg',
  'entities/circle-symbolic.svg',
  'entities/polyline-symbolic.svg',
  'entities/rectangle-symbolic.svg',
  'entities/text-symbolic.svg',

  'tools/copy-symbolic.svg',
  'tools/erase-symbolic.svg',
  'tools/extend-symbolic.svg',
  'tools/move-symbolic.svg',
  'tools/rotate-symbolic.svg',
  'tools/trim-symbolic.svg',
  ]

scalable_dir = join_paths('hicolor', 'scalable', 'apps')
install_dir = join_paths(get_option('datadir'),'icons', scalable_dir)

foreach icon : icons
  file = join_paths(scalable_dir, icon)
  install_data(file, install_dir: install_dir)
endforeach



install_data(
  join_paths(scalable_dir, ('@0@.svg').format(application_id)),
  install_dir: join_paths(get_option('datadir'), 'icons', scalable_dir)
)

symbolic_dir = join_paths('hicolor', 'symbolic', 'apps')

install_data(
  join_paths(symbolic_dir, ('@0@-symbolic.svg').format(application_id)),
  install_dir: join_paths(get_option('datadir'), 'icons', symbolic_dir)
)
