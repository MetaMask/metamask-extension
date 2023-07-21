#!/usr/bin/env node
//
// build task definitions
//
// run any task with "yarn build ${taskName}"
//
const path = require('path');
const livereload = require('gulp-livereload');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { sync: globby } = require('globby');
const lavapack = require('@lavamoat/lavapack');
const difference = require('lodash/difference');
const { intersection } = require('lodash');
const { getVersion } = require('../lib/get-version');
const { loadBuildTypesConfig } = require('../lib/build-type');
const { BUILD_TARGETS, TASKS } = require('./constants');
const {
  createTask,
  composeSeries,
  composeParallel,
  runTask,
} = require('./task');
const createManifestTasks = require('./manifest');
const createScriptTasks = require('./scripts');
const createStyleTasks = require('./styles');
const createStaticAssetTasks = require('./static');
const createEtcTasks = require('./etc');
const { getBrowserVersionMap, getEnvironment } = require('./utils');
const { getConfig } = require('./config');

// Packages required dynamically via browserify configuration in dependencies
// Required for LavaMoat policy generation
require('loose-envify');
require('globalthis');
require('@babel/preset-env');
require('@babel/preset-react');
require('@babel/preset-typescript');
require('@babel/core');
// ESLint-related
require('@babel/eslint-parser');
require('@babel/eslint-plugin');
require('@metamask/eslint-config');
require('@metamask/eslint-config-nodejs');
require('@typescript-eslint/parser');
require('eslint');
require('eslint-config-prettier');
require('eslint-import-resolver-node');
require('eslint-import-resolver-typescript');
require('eslint-plugin-import');
require('eslint-plugin-jsdoc');
require('eslint-plugin-node');
require('eslint-plugin-prettier');
require('eslint-plugin-react');
require('eslint-plugin-react-hooks');
require('eslint-plugin-jest');

defineAndRunBuildTasks().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});

async function defineAndRunBuildTasks() {
  const {
    applyLavaMoat,
    buildType,
    entryTask,
    isLavaMoat,
    policyOnly,
    shouldIncludeLockdown,
    shouldIncludeSnow,
    shouldLintFenceFiles,
    skipStats,
    version,
    platform,
  } = await parseArgv();

  const isRootTask = Object.values(BUILD_TARGETS).includes(entryTask);

  if (isRootTask) {
    // scuttle on production/tests environment only
    const shouldScuttle = entryTask !== BUILD_TARGETS.DEV;

    let scuttleGlobalThisExceptions = [
      // globals used by different mm deps outside of lm compartment
      'toString',
      'getComputedStyle',
      'addEventListener',
      'removeEventListener',
      'ShadowRoot',
      'HTMLElement',
      'Element',
      'pageXOffset',
      'pageYOffset',
      'visualViewport',
      'Reflect',
      'Set',
      'Object',
      'navigator',
      'harden',
      'console',
      'WeakSet',
      'Event',
      'Image', // Used by browser to generate notifications
      // globals chromedriver needs to function
      /cdc_[a-zA-Z0-9]+_[a-zA-Z]+/iu,
      'performance',
      'parseFloat',
      'innerWidth',
      'innerHeight',
      'Symbol',
      'Math',
      'DOMRect',
      'Number',
      'Array',
      'crypto',
      'Function',
      'Uint8Array',
      'String',
      'Promise',
      'JSON',
      'Date',
      // globals sentry needs to function
      '__SENTRY__',
      'appState',
      'extra',
      'stateHooks',
      'sentryHooks',
      'sentry',
    ];

    if (
      entryTask === BUILD_TARGETS.TEST ||
      entryTask === BUILD_TARGETS.TEST_DEV
    ) {
      scuttleGlobalThisExceptions = [
        ...scuttleGlobalThisExceptions,
        // more globals chromedriver needs to function
        // in the future, more of the globals above can be put in this list
        'Proxy',
        'ret_nodes',
      ];
    }

    console.log(
      `Building lavamoat runtime file`,
      `(scuttling is ${shouldScuttle ? 'on' : 'off'})`,
    );

    // build lavamoat runtime file
    await lavapack.buildRuntime({
      scuttleGlobalThis: {
        enabled: applyLavaMoat && shouldScuttle,
        scuttlerName: 'SCUTTLER',
        exceptions: scuttleGlobalThisExceptions,
      },
    });
  }

  const browserPlatforms = platform ? [platform] : ['firefox', 'chrome'];

  const browserVersionMap = getBrowserVersionMap(browserPlatforms, version);

  const ignoredFiles = getIgnoredFiles(buildType);

  const staticTasks = createStaticAssetTasks({
    livereload,
    browserPlatforms,
    shouldIncludeLockdown,
    shouldIncludeSnow,
    buildType,
  });

  const manifestTasks = createManifestTasks({
    browserPlatforms,
    browserVersionMap,
    buildType,
    applyLavaMoat,
    shouldIncludeSnow,
    entryTask,
  });

  const styleTasks = createStyleTasks({ livereload });

  const scriptTasks = createScriptTasks({
    applyLavaMoat,
    browserPlatforms,
    buildType,
    ignoredFiles,
    isLavaMoat,
    livereload,
    policyOnly,
    shouldLintFenceFiles,
    version,
  });

  const { clean, reload, zip } = createEtcTasks({
    livereload,
    browserPlatforms,
    buildType,
    version,
  });

  // build for development (livereload)
  createTask(
    TASKS.DEV,
    composeSeries(
      clean,
      styleTasks.dev,
      composeParallel(
        scriptTasks.dev,
        staticTasks.dev,
        manifestTasks.dev,
        reload,
      ),
    ),
  );

  // build for test development (livereload)
  createTask(
    TASKS.TEST_DEV,
    composeSeries(
      clean,
      styleTasks.dev,
      composeParallel(
        scriptTasks.testDev,
        staticTasks.dev,
        manifestTasks.testDev,
        reload,
      ),
    ),
  );

  // build production-like distributable build
  createTask(
    TASKS.DIST,
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.dist, staticTasks.prod, manifestTasks.prod),
      zip,
    ),
  );

  // build for prod release
  createTask(
    TASKS.PROD,
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.prod, staticTasks.prod, manifestTasks.prod),
      zip,
    ),
  );

  // build just production scripts, for LavaMoat policy generation purposes
  createTask(TASKS.SCRIPTS_DIST, scriptTasks.dist);

  // build for CI testing
  createTask(
    TASKS.TEST,
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.test, staticTasks.prod, manifestTasks.test),
      zip,
    ),
  );

  // special build for minimal CI testing
  createTask(TASKS.styles, styleTasks.prod);

  // Finally, start the build process by running the entry task.
  await runTask(entryTask, { skipStats });
}

async function parseArgv() {
  const { argv } = yargs(hideBin(process.argv))
    .usage('$0 <task> [options]', 'Build the MetaMask extension.', (_yargs) =>
      _yargs
        .positional('task', {
          description: `The task to run. There are a number of main tasks, each of which calls other tasks internally. The main tasks are:

dev: Create an unoptimized, live-reloading build for local development.

dist: Create an optimized production-like for a non-production environment.

prod: Create an optimized build for a production environment.

test: Create an optimized build for running e2e tests.

testDev: Create an unoptimized, live-reloading build for debugging e2e tests.`,
          type: 'string',
        })
        .option('apply-lavamoat', {
          default: true,
          description:
            'Whether to use LavaMoat. Setting this to `false` can be useful during development if you want to handle LavaMoat errors later.',
          type: 'boolean',
        })
        .option('build-type', {
          default: loadBuildTypesConfig().default,
          description: 'The type of build to create.',
          choices: Object.keys(loadBuildTypesConfig().buildTypes),
        })
        .option('build-version', {
          default: 0,
          description:
            'The build version. This is set only for non-main build types. The build version is used in the "prerelease" segment of the extension version, e.g. `[major].[minor].[patch]-[build-type].[build-version]`',
          type: 'number',
        })
        .option('lint-fence-files', {
          description:
            'Whether files with code fences should be linted after fences have been removed. The build will fail if linting fails. This defaults to `false` if the entry task is `dev` or `testDev`. Otherwise this defaults to `true`.',
          type: 'boolean',
        })
        .option('lockdown', {
          default: true,
          description:
            'Whether to include SES lockdown files in the extension bundle. Setting this to `false` can be useful during development if you want to handle lockdown errors later.',
          type: 'boolean',
        })
        .option('snow', {
          default: true,
          description:
            'Whether to include Snow files in the extension bundle. Setting this to `false` can be useful during development if you want to handle Snow errors later.',
          type: 'boolean',
        })
        .option('policy-only', {
          default: false,
          description:
            'Stop the build after generating the LavaMoat policy, skipping any writes to disk other than the LavaMoat policy itself.',
          type: 'boolean',
        })
        .option('skip-stats', {
          default: false,
          description:
            'Whether to skip logging the time to completion for each task to the console. This is meant primarily for internal use, to prevent duplicate logging.',
          hidden: true,
          type: 'boolean',
        })
        .option('platform', {
          default: '',
          description:
            'Specify a single browser platform to build for. Either `chrome` or `firefox`',
          hidden: true,
          type: 'string',
        })
        .check((args) => {
          if (!Number.isInteger(args.buildVersion)) {
            throw new Error(
              `Expected integer for 'build-version', got '${args.buildVersion}'`,
            );
          } else if (!Object.values(TASKS).includes(args.task)) {
            throw new Error(`Invalid task: '${args.task}'`);
          }
          return true;
        }),
    )
    // TODO: Enable `.strict()` after this issue is resolved: https://github.com/LavaMoat/LavaMoat/issues/344
    .help('help');

  const {
    applyLavamoat: applyLavaMoat,
    buildType,
    buildVersion,
    lintFenceFiles,
    lockdown,
    snow,
    policyOnly,
    skipStats,
    task,
    platform,
  } = argv;

  // Manually default this to `false` for dev builds only.
  const shouldLintFenceFiles = lintFenceFiles ?? !/dev/iu.test(task);

  const version = getVersion(buildType, buildVersion);

  const highLevelTasks = Object.values(BUILD_TARGETS);
  if (highLevelTasks.includes(task)) {
    const environment = getEnvironment({ buildTarget: task });
    // Output ignored, this is only called to ensure config is validated
    await getConfig(buildType, environment);
  }

  return {
    applyLavaMoat,
    buildType,
    entryTask: task,
    isLavaMoat: process.argv[0].includes('lavamoat'),
    policyOnly,
    shouldIncludeLockdown: lockdown,
    shouldIncludeSnow: snow,
    shouldLintFenceFiles,
    skipStats,
    version,
    platform,
  };
}

/**
 * Gets the files to be ignored by the current build, if any.
 *
 * @param {string} currentBuildType - The type of the current build.
 * @returns {string[] | null} The array of files to be ignored by the current
 * build, or `null` if no files are to be ignored.
 */
function getIgnoredFiles(currentBuildType) {
  const buildConfig = loadBuildTypesConfig();
  const cwd = process.cwd();

  const exclusiveAssetsForFeatures = (features) =>
    globby(
      features
        .flatMap(
          (feature) =>
            buildConfig.features[feature].assets
              ?.filter((asset) => 'exclusiveInclude' in asset)
              .map((asset) => asset.exclusiveInclude) ?? [],
        )
        .map((pathGlob) => path.resolve(cwd, pathGlob)),
    );

  const allFeatures = Object.keys(buildConfig.features);
  const activeFeatures =
    buildConfig.buildTypes[currentBuildType].features ?? [];
  const inactiveFeatures = difference(allFeatures, activeFeatures);

  const ignoredPaths = exclusiveAssetsForFeatures(inactiveFeatures);
  // We do a sanity check to verify that any inactive feature haven't excluded files
  // that active features are trying to include
  const activePaths = exclusiveAssetsForFeatures(activeFeatures);
  const conflicts = intersection(activePaths, ignoredPaths);
  if (conflicts.length !== 0) {
    throw new Error(`Below paths are required exclusively by both active and inactive features resulting in a conflict:
\t-> ${conflicts.join('\n\t-> ')}
Please fix builds.yml`);
  }

  return ignoredPaths;
}
