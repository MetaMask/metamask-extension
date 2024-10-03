const path = require('path');
const fs = require('fs-extra');
const watch = require('gulp-watch');
const glob = require('fast-glob');

const { loadBuildTypesConfig } = require('../lib/build-type');

const { isManifestV3 } = require('../../shared/modules/mv3.utils');
const { TASKS } = require('./constants');
const { createTask, composeSeries } = require('./task');
const { getPathInsideNodeModules } = require('./utils');

const EMPTY_JS_FILE = './development/empty.js';

module.exports = function createStaticAssetTasks({
  livereload,
  browserPlatforms,
  shouldIncludeLockdown = true,
  shouldIncludeSnow = true,
  buildType,
}) {
  const copyTargetsProds = {};
  const copyTargetsDevs = {};

  const buildConfig = loadBuildTypesConfig();

  const activeFeatures = buildConfig.buildTypes[buildType].features ?? [];

  browserPlatforms.forEach((browser) => {
    const [copyTargetsProd, copyTargetsDev] = getCopyTargets(
      shouldIncludeLockdown,
      shouldIncludeSnow,
    );
    copyTargetsProds[browser] = copyTargetsProd;
    copyTargetsDevs[browser] = copyTargetsDev;
  });

  const additionalAssets = activeFeatures.flatMap(
    (feature) =>
      buildConfig.features[feature].assets?.filter(
        (asset) => !('exclusiveInclude' in asset),
      ) ?? [],
  );

  Object.entries(copyTargetsProds).forEach(([_, copyTargetsProd]) =>
    copyTargetsProd.push(...additionalAssets),
  );
  Object.entries(copyTargetsDevs).forEach(([_, copyTargetsDev]) =>
    copyTargetsDev.push(...additionalAssets),
  );

  const prodTasks = [];
  Object.entries(copyTargetsProds).forEach(([browser, copyTargetsProd]) => {
    copyTargetsProd.forEach((target) => {
      prodTasks.push(async function copyStaticAssets() {
        await performCopy(target, browser);
      });
    });
  });

  const devTasks = [];
  Object.entries(copyTargetsDevs).forEach(([browser, copyTargetsDev]) => {
    copyTargetsDev.forEach((target) => {
      devTasks.push(async function copyStaticAssets() {
        await setupLiveCopy(target, browser);
      });
    });
  });

  const prod = createTask(TASKS.STATIC_PROD, composeSeries(...prodTasks));
  const dev = createTask(TASKS.STATIC_DEV, composeSeries(...devTasks));

  return { dev, prod };

  async function setupLiveCopy(target, browser) {
    const pattern = target.pattern === undefined ? '/**/*' : target.pattern;
    watch(target.src + pattern, (event) => {
      livereload.changed(event.path);
      performCopy(target, browser);
    });
    await performCopy(target, browser);
  }

  async function performCopy(target, browser) {
    if (target.pattern === undefined) {
      await copyGlob(
        target.src,
        `${target.src}`,
        `./dist/${browser}/${target.dest}`,
      );
    } else {
      await copyGlob(
        target.src,
        `${target.src}${target.pattern}`,
        `./dist/${browser}/${target.dest}`,
      );
    }
  }

  async function copyGlob(baseDir, srcGlob, dest) {
    const sources = await glob(srcGlob, { onlyFiles: false });
    await Promise.all(
      sources.map(async (src) => {
        const relativePath = path.relative(baseDir, src);
        await fs.copy(src, `${dest}${relativePath}`, { overwrite: true });
      }),
    );
  }
};

function getCopyTargets(shouldIncludeLockdown, shouldIncludeSnow) {
  const allCopyTargets = [
    {
      src: `./app/_locales/`,
      dest: `_locales`,
    },
    {
      src: `./app/images/`,
      dest: `images`,
    },
    {
      src: getPathInsideNodeModules('@metamask/contract-metadata', 'images/'),
      dest: `images/contract`,
    },
    {
      src: `./ui/css/utilities/fonts/`,
      dest: `fonts`,
    },
    {
      src: `./app/vendor/`,
      dest: `vendor`,
    },
    {
      src: getPathInsideNodeModules(
        '@fortawesome/fontawesome-free',
        'webfonts/',
      ),
      // update this location in styles.js if it changes
      dest: `fonts/fontawesome`,
    },
    {
      src: `./ui/css/output/`,
      pattern: `*.css`,
      dest: ``,
    },
    ...(shouldIncludeSnow
      ? [
          {
            src: `./node_modules/@lavamoat/snow/snow.prod.js`,
            dest: `scripts/snow.js`,
          },
          {
            src: `./app/scripts/use-snow.js`,
            dest: `scripts/use-snow.js`,
          },
        ]
      : []),
    {
      src: shouldIncludeLockdown
        ? getPathInsideNodeModules('ses', 'dist/lockdown.umd.min.js')
        : EMPTY_JS_FILE,
      dest: `scripts/lockdown-install.js`,
    },
    {
      src: './app/scripts/init-globals.js',
      dest: 'scripts/init-globals.js',
    },
    {
      src: shouldIncludeLockdown
        ? `./app/scripts/lockdown-run.js`
        : EMPTY_JS_FILE,
      dest: `scripts/lockdown-run.js`,
    },
    {
      src: shouldIncludeLockdown
        ? `./app/scripts/lockdown-more.js`
        : EMPTY_JS_FILE,
      dest: `scripts/lockdown-more.js`,
    },
    {
      src: getPathInsideNodeModules('@lavamoat/lavapack', 'src/runtime-cjs.js'),
      dest: `scripts/runtime-cjs.js`,
      pattern: '',
    },
    {
      src: getPathInsideNodeModules('@lavamoat/lavapack', 'src/runtime.js'),
      dest: `scripts/runtime-lavamoat.js`,
      pattern: '',
    },
    {
      src: getPathInsideNodeModules('@blockaid/ppom_release', '/'),
      pattern: '*.wasm',
      dest: isManifestV3 ? 'scripts/' : '',
    },
    ...(isManifestV3
      ? [
          {
            src: getPathInsideNodeModules(
              '@metamask/snaps-execution-environments',
              'dist/browserify/iframe/index.html',
            ),
            dest: `snaps/index.html`,
            pattern: '',
          },
          {
            src: getPathInsideNodeModules(
              '@metamask/snaps-execution-environments',
              'dist/browserify/iframe/bundle.js',
            ),
            dest: `snaps/bundle.js`,
            pattern: '',
          },
        ]
      : []),
  ];

  const copyTargetsDev = [
    ...allCopyTargets,
    {
      src: './development',
      pattern: '/chromereload.js',
      dest: ``,
    },
    // empty files to suppress missing file errors
    {
      src: EMPTY_JS_FILE,
      dest: `bg-libs.js`,
    },
    {
      src: EMPTY_JS_FILE,
      dest: `ui-libs.js`,
    },
  ];

  const copyTargetsProd = [
    ...allCopyTargets,
    // empty files to suppress missing file errors
    {
      src: EMPTY_JS_FILE,
      dest: `chromereload.js`,
    },
  ];

  return [copyTargetsProd, copyTargetsDev];
}
