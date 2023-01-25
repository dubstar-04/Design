application_id = 'wood.dan.design'

icons = [
  'entities/arc.svg',
  'entities/line.svg',
  'entities/circle.svg',
  'entities/polyline.svg',
  'entities/rectangle.svg',
  'entities/text.svg',

  'tools/copy.svg',
  'tools/erase.svg',
  'tools/extend.svg',
  'tools/move.svg',
  'tools/rotate.svg',
  'tools/trim.svg',
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
