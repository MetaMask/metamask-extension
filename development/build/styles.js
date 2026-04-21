const { join } = require('path');
const pify = require('pify');
const gulp = require('gulp');
const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const rtlcss = require('postcss-rtlcss');
const discardFonts = require('postcss-discard-font-face');
const postcss = require('gulp-postcss');
const pipeline = pify(require('readable-stream').pipeline);
const sass = require('sass-embedded');
const gulpSass = require('gulp-sass')(sass);
const loadTailwindPostcss = require('../lib/load-tailwind-postcss.cjs');
const { TASKS } = require('./constants');
const { createTask } = require('./task');

const repoRoot = join(__dirname, '../..');

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

  return { prod, dev };

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
      await buildScssPipeline(src, dest, devMode);
    }
  }
}

async function buildScssPipeline(src, dest, devMode) {
  await pipeline(
    ...[
      // pre-process
      gulp.src(src),
      devMode && sourcemaps.init(),
      gulpSass({
        // The order of includePaths is important; prefer our own
        // folders over `node_modules`
        includePaths: [
          // enables shortcuts to `@use design-system`, `@use utilities`, etc.
          'ui/css/',
          'node_modules/',
        ],
        functions: {
          // Tell sass where to find the font-awesome font files
          // update this location in static.js if it changes
          '-mm-fa-path()': () => new sass.SassString('./fonts/fontawesome'),
        },
      }).on('error', gulpSass.logError),
      postcss([
        // Pin Tailwind's source-detection base to the repo root so the
        // explicit @source entries in ui/css/tailwind.css resolve
        // consistently in this gulp/PostCSS pipeline instead of depending on
        // process.cwd(). Tailwind docs:
        // https://tailwindcss.com/docs/detecting-classes-in-source-files
        loadTailwindPostcss({ base: repoRoot }),
        rtlcss(),
        discardFonts(['woff2']),
      ]),
      devMode && sourcemaps.write(),
      gulp.dest(dest),
    ].filter(Boolean),
  );
}
