const { promises: fs } = require('fs');
const gulp = require('gulp');
const gulpZip = require('gulp-zip');
const del = require('del');
const pify = require('pify');
const pump = pify(require('pump'));

const { BuildType } = require('../lib/build-type');
const { createTask, composeParallel } = require('./task');

module.exports = createEtcTasks;

function createEtcTasks({ browserPlatforms, buildType, livereload, version }) {
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
      ...browserPlatforms.map((platform) =>
        createZipTask(platform, buildType, version),
      ),
    ),
  );

  return { clean, reload, zip };
}

function createZipTask(platform, buildType, version) {
  return async () => {
    const path =
      buildType === BuildType.main
        ? `metamask-${platform}-${version}`
        : `metamask-${buildType}-${platform}-${version}`;
    await pump(
      gulp.src(`dist/${platform}/**`),
      gulpZip(`${path}.zip`),
      gulp.dest('builds'),
    );
  };
}
