const { promises: fs } = require('fs');
const gulp = require('gulp');
const sort = require('gulp-sort');
const gulpZip = require('gulp-zip');
const del = require('del');
const pify = require('pify');
const pump = pify(require('pump'));

const { BuildType } = require('../lib/build-type');
const { TASKS } = require('./constants');
const { createTask, composeParallel } = require('./task');

module.exports = createEtcTasks;

function createEtcTasks({ browserPlatforms, buildType, livereload, version }) {
  const clean = createTask(TASKS.CLEAN, async function clean() {
    await del(['./dist/*']);
    await Promise.all(
      browserPlatforms.map(async (platform) => {
        await fs.mkdir(`./dist/${platform}`, { recursive: true });
      }),
    );
  });

  const reload = createTask(TASKS.RELOAD, function devReload() {
    livereload.listen({ port: 35729 });
  });

  // zip tasks for distribution
  const zip = createTask(
    TASKS.ZIP,
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
      // sort files and set `mtime` to epoch to ensure zip build is deterministic
      sort(),
      gulpZip(`${path}.zip`, { modifiedTime: new Date(0) }),
      gulp.dest('builds'),
    );
  };
}
