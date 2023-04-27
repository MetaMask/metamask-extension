const { promises: fs } = require('fs');
const gulp = require('gulp');
const sort = require('gulp-sort');
const gulpZip = require('gulp-zip');
const del = require('del');
const pify = require('pify');
const pump = pify(require('pump'));

const { loadBuildTypesConfig } = require('../lib/build-type');
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
      buildType === loadBuildTypesConfig().default
        ? `metamask-${platform}-${version}`
        : `metamask-${buildType}-${platform}-${version}`;
    await pump(
      gulp.src(`dist/${platform}/**`),
      // sort files and set `mtime` to epoch to ensure zip build is deterministic
      sort(),
      // Modified time set to an arbitrary static date to ensure build the is reproducible.
      // The date chosen is MetaMask's birthday. Originally we chose the Unix epoch, but this
      // resulted in invalid dates on certain timezones/operating systems.
      gulpZip(`${path}.zip`, { modifiedTime: new Date('2016-07-14T00:00:00') }),
      gulp.dest('builds'),
    );
  };
}
