const { promises: fs } = require('fs');
const gulp = require('gulp');
const gulpZip = require('gulp-zip');
const del = require('del');
const pify = require('pify');
const pump = pify(require('pump'));
const { version } = require('../../package.json');
const { createTask, composeParallel } = require('./task');

module.exports = createEtcTasks;

function createEtcTasks({ browserPlatforms, livereload }) {
  const clean = createTask('clean', async function clean() {
    await del(['./dist/*']);
    await Promise.all(
      browserPlatforms.map(async (platform) => {
        await fs.mkdir(`./dist/${platform}`, { recursive: true });
      }),
    );
  });

  const reload = createTask('reload', function devReload() {
    livereload.listen({ port: 35729 });
  });

  // zip tasks for distribution
  const zip = createTask(
    'zip',
    composeParallel(
      ...browserPlatforms.map((platform) => createZipTask(platform)),
    ),
  );

  return { clean, reload, zip };
}

function createZipTask(target) {
  return async () => {
    await pump(
      gulp.src(`dist/${target}/**`),
      gulpZip(`metamask-${target}-${version}.zip`),
      gulp.dest('builds'),
    );
  };
}
