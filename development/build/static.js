const path = require('path');
const fs = require('fs-extra');
const watch = require('gulp-watch');
const glob = require('fast-glob');

const locales = require('../../app/_locales/index.json');
const { BuildType } = require('../lib/build-type');

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

  browserPlatforms.forEach((browser) => {
    const [copyTargetsProd, copyTargetsDev] = getCopyTargets(
      shouldIncludeLockdown,
      shouldIncludeSnow,
    );
    copyTargetsProds[browser] = copyTargetsProd;
    copyTargetsDevs[browser] = copyTargetsDev;
  });

  const additionalBuildTargets = {
    [BuildType.beta]: [
      {
        src: './app/build-types/beta/images/',
        dest: `images`,
      },
    ],
    [BuildType.flask]: [
      {
        src: './app/build-types/flask/images/',
        dest: `images`,
      },
    ],
  };

  if (Object.keys(additionalBuildTargets).includes(buildType)) {
    Object.entries(copyTargetsProds).forEach(([_, copyTargetsProd]) =>
      copyTargetsProd.push(...additionalBuildTargets[buildType]),
    );
    Object.entries(copyTargetsDevs).forEach(([_, copyTargetsDev]) =>
      copyTargetsDev.push(...additionalBuildTargets[buildType]),
    );
  }

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
        await fs.copy(src, `${dest}${relativePath}`);
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
      src: `./app/fonts/`,
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
      dest: `fonts/fontawesome`,
    },
    {
      src: getPathInsideNodeModules('react-responsive-carousel', 'lib/styles/'),
      dest: 'react-gallery/',
    },
    {
      src: `./ui/css/output/`,
      pattern: `*.css`,
      dest: ``,
    },
    {
      src: `./app/loading.html`,
      dest: `loading.html`,
    },
    {
      src: getPathInsideNodeModules('globalthis', 'dist/browser.js'),
      dest: `globalthis.js`,
    },
    {
      src: shouldIncludeSnow
        ? `./node_modules/@lavamoat/snow/snow.prod.js`
        : EMPTY_JS_FILE,
      dest: `snow.js`,
    },
    {
      src: shouldIncludeSnow ? `./app/scripts/use-snow.js` : EMPTY_JS_FILE,
      dest: `use-snow.js`,
    },
    {
      src: shouldIncludeLockdown
        ? getPathInsideNodeModules('ses', 'dist/lockdown.umd.min.js')
        : EMPTY_JS_FILE,
      dest: `lockdown-install.js`,
    },
    {
      src: './app/scripts/init-globals.js',
      dest: 'init-globals.js',
    },
    {
      src: shouldIncludeLockdown
        ? `./app/scripts/lockdown-run.js`
        : EMPTY_JS_FILE,
      dest: `lockdown-run.js`,
    },
    {
      src: shouldIncludeLockdown
        ? `./app/scripts/lockdown-more.js`
        : EMPTY_JS_FILE,
      dest: `lockdown-more.js`,
    },
    {
      src: getPathInsideNodeModules('@lavamoat/lavapack', 'src/runtime-cjs.js'),
      dest: `runtime-cjs.js`,
      pattern: '',
    },
    {
      src: getPathInsideNodeModules('@lavamoat/lavapack', 'src/runtime.js'),
      dest: `runtime-lavamoat.js`,
      pattern: '',
    },
  ];

  const languageTags = new Set();
  for (const locale of locales) {
    const { code } = locale;
    const tag = code.split('_')[0];
    languageTags.add(tag);
  }

  for (const tag of languageTags) {
    allCopyTargets.push({
      src: getPathInsideNodeModules(
        '@formatjs/intl-relativetimeformat',
        `dist/locale-data/${tag}.json`,
      ),
      dest: `intl/${tag}/relative-time-format-data.json`,
    });
  }

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
