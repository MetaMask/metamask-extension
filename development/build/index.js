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
const { getVersion } = require('../lib/get-version');
const { BuildType } = require('../lib/build-type');
const { TASKS, ENVIRONMENT } = require('./constants');
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
const { getConfig, getProductionConfig } = require('./config');
const { BUILD_TARGETS } = require('./constants');

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
  } = await parseArgv();

  const browserPlatforms = ['firefox', 'chrome'];

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
          default: BuildType.main,
          description: 'The type of build to create.',
          choices: Object.keys(BuildType),
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
  } = argv;

  // Manually default this to `false` for dev builds only.
  const shouldLintFenceFiles = lintFenceFiles ?? !/dev/iu.test(task);

  const version = getVersion(buildType, buildVersion);

  const highLevelTasks = Object.values(BUILD_TARGETS);
  if (highLevelTasks.includes(task)) {
    const environment = getEnvironment({ buildTarget: task });
    if (environment === ENVIRONMENT.PRODUCTION) {
      // Output ignored, this is only called to ensure config is validated
      await getProductionConfig(buildType);
    } else {
      // Output ignored, this is only called to ensure config is validated
      await getConfig();
    }
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
  const excludedFiles = Object.values(BuildType)
    // This filter removes "main" and the current build type. The files of any
    // build types that remain in the array will be excluded. "main" is the
    // default build type, and has no files that are excluded from other builds.
    .filter(
      (buildType) =>
        buildType !== BuildType.main && buildType !== currentBuildType,
    )
    // Compute globs targeting files for exclusion for each excluded build
    // type.
    .reduce((excludedGlobs, excludedBuildType) => {
      return excludedGlobs.concat([
        `../../app/**/${excludedBuildType}/**`,
        `../../shared/**/${excludedBuildType}/**`,
        `../../ui/**/${excludedBuildType}/**`,
      ]);
    }, [])
    // This creates absolute paths of the form:
    // PATH_TO_REPOSITORY_ROOT/app/**/${excludedBuildType}/**
    .map((pathGlob) => path.resolve(__dirname, pathGlob));

  return globby(excludedFiles);
}
