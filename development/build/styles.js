const pify = require('pify');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const gulpStylelint = require('gulp-stylelint');
const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const rtlcss = require('gulp-rtlcss');
const rename = require('gulp-rename');
const pump = pify(require('pump'));
const { TASKS } = require('./constants');
const { createTask } = require('./task');

let sass;

// scss compilation and autoprefixing tasks
module.exports = createStyleTasks;

function createStyleTasks({ livereload }) {
  const prod = createTask(
    TASKS.STYLES_PROD,
    createScssBuildTask({
      src: 'ui/css/index.scss',
      dest: 'ui/css/output',
      devMode: false,
    }),
  );

  const dev = createTask(
    TASKS.STYLES_DEV,
    createScssBuildTask({
      src: 'ui/css/index.scss',
      dest: 'ui/css/output',
      devMode: true,
      pattern: 'ui/**/*.scss',
    }),
  );

  const lint = createTask(TASKS.LINT_SCSS, function () {
    return gulp.src('ui/css/itcss/**/*.scss').pipe(
      gulpStylelint({
        reporters: [{ formatter: 'string', console: true }],
        fix: true,
      }),
    );
  });

  return { prod, dev, lint };

  function createScssBuildTask({ src, dest, devMode, pattern }) {
    return async function () {
      if (devMode) {
        watch(pattern, async (event) => {
          await buildScss();
          livereload.changed(event.path);
        });
      }
      await buildScss();
    };

    async function buildScss() {
      await buildScssPipeline(src, dest, devMode, false);
      await buildScssPipeline(src, dest, devMode, true);
    }
  }
}

async function buildScssPipeline(src, dest, devMode, rtl) {
  if (!sass) {
    // use our own compiler which runs sass in its own process
    // in order to not pollute the intrinsics
    // eslint-disable-next-line node/global-require
    sass = require('gulp-sass')(require('./sass-compiler'));
  }
  await pump(
    ...[
      // pre-process
      gulp.src(src),
      devMode && sourcemaps.init(),
      sass().on('error', sass.logError),
      autoprefixer(),
      rtl && rtlcss(),
      rtl && rename({ suffix: '-rtl' }),
      devMode && sourcemaps.write(),
      gulp.dest(dest),
    ].filter(Boolean),
  );
}
