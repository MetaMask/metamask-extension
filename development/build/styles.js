const pify = require('pify');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const gulpStylelint = require('gulp-stylelint');
const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const rtlcss = require('gulp-rtlcss');
const rename = require('gulp-rename');
const pump = pify(require('pump'));
const { createTask } = require('./task');

let sass;

// scss compilation and autoprefixing tasks
module.exports = createStyleTasks;

function createStyleTasks({ livereload }) {
  const prod = createTask(
    'styles:prod',
    createScssBuildTask({
      src: 'ui/app/css/index.scss',
      dest: 'ui/app/css/output',
      devMode: false,
    }),
  );

  const dev = createTask(
    'styles:dev',
    createScssBuildTask({
      src: 'ui/app/css/index.scss',
      dest: 'ui/app/css/output',
      devMode: true,
      pattern: 'ui/app/**/*.scss',
    }),
  );

  const lint = createTask('lint-scss', function () {
    return gulp.src('ui/app/css/itcss/**/*.scss').pipe(
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
      await Promise.all([
        buildScssPipeline(src, dest, devMode, false),
        buildScssPipeline(src, dest, devMode, true),
      ]);
    }
  }
}

async function buildScssPipeline(src, dest, devMode, rtl) {
  if (!sass) {
    // eslint-disable-next-line node/global-require
    sass = require('gulp-dart-sass');
    // use our own compiler which runs sass in its own process
    // in order to not pollute the intrinsics
    // eslint-disable-next-line node/global-require
    sass.compiler = require('./sass-compiler.js');
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
