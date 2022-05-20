//
// build task definitions
//
// run any task with "yarn build ${taskName}"
//
const path = require('path');
const livereload = require('gulp-livereload');
const minimist = require('minimist');
const { sync: globby } = require('globby');
const { getVersion } = require('../lib/get-version');
const { BuildType } = require('../lib/build-type');
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
const { getBrowserVersionMap } = require('./utils');

// Packages required dynamically via browserify configuration in dependencies
// Required for LavaMoat policy generation
require('loose-envify');
require('globalthis');
require('@babel/plugin-proposal-object-rest-spread');
require('@babel/plugin-transform-runtime');
require('@babel/plugin-proposal-class-properties');
require('@babel/plugin-proposal-optional-chaining');
require('@babel/plugin-proposal-nullish-coalescing-operator');
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

defineAndRunBuildTasks();

function defineAndRunBuildTasks() {
  const {
    applyLavaMoat,
    buildType,
    entryTask,
    isLavaMoat,
    policyOnly,
    shouldIncludeLockdown,
    shouldLintFenceFiles,
    skipStats,
    version,
  } = parseArgv();

  const browserPlatforms = ['firefox', 'chrome', 'brave', 'opera'];

  const browserVersionMap = getBrowserVersionMap(browserPlatforms, version);

  const ignoredFiles = getIgnoredFiles(buildType);

  const staticTasks = createStaticAssetTasks({
    livereload,
    browserPlatforms,
    shouldIncludeLockdown,
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
    'dev',
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
    'testDev',
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

  // build for prod release
  createTask(
    'prod',
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.prod, staticTasks.prod, manifestTasks.prod),
      zip,
    ),
  );

  // build just production scripts, for LavaMoat policy generation purposes
  createTask('scripts:prod', scriptTasks.prod);

  // build for CI testing
  createTask(
    'test',
    composeSeries(
      clean,
      styleTasks.prod,
      composeParallel(scriptTasks.test, staticTasks.prod, manifestTasks.test),
      zip,
    ),
  );

  // special build for minimal CI testing
  createTask('styles', styleTasks.prod);

  // Finally, start the build process by running the entry task.
  runTask(entryTask, { skipStats });
}

function parseArgv() {
  const NamedArgs = {
    ApplyLavaMoat: 'apply-lavamoat',
    BuildType: 'build-type',
    BuildVersion: 'build-version',
    LintFenceFiles: 'lint-fence-files',
    Lockdown: 'lockdown',
    PolicyOnly: 'policy-only',
    SkipStats: 'skip-stats',
  };

  const argv = minimist(process.argv.slice(2), {
    boolean: [
      NamedArgs.ApplyLavaMoat,
      NamedArgs.LintFenceFiles,
      NamedArgs.Lockdown,
      NamedArgs.PolicyOnly,
      NamedArgs.SkipStats,
    ],
    string: [NamedArgs.BuildType, NamedArgs.BuildVersion],
    default: {
      [NamedArgs.ApplyLavaMoat]: true,
      [NamedArgs.BuildType]: BuildType.main,
      [NamedArgs.BuildVersion]: '0',
      [NamedArgs.LintFenceFiles]: true,
      [NamedArgs.Lockdown]: true,
      [NamedArgs.PolicyOnly]: false,
      [NamedArgs.SkipStats]: false,
    },
  });

  if (argv._.length !== 1) {
    throw new Error(
      `Metamask build: Expected a single positional argument, but received "${argv._.length}" arguments.`,
    );
  }

  const entryTask = argv._[0];
  if (!entryTask) {
    throw new Error('MetaMask build: No entry task specified.');
  }

  const buildType = argv[NamedArgs.BuildType];
  if (!(buildType in BuildType)) {
    throw new Error(`MetaMask build: Invalid build type: "${buildType}"`);
  }

  const rawBuildVersion = argv[NamedArgs.BuildVersion];
  const buildVersion = Number.parseInt(rawBuildVersion, 10);
  if (rawBuildVersion.match(/^\d+$/u) === null || Number.isNaN(buildVersion)) {
    throw new Error(
      `MetaMask build: Invalid build version: "${rawBuildVersion}"`,
    );
  }

  // Manually default this to `false` for dev builds only.
  const shouldLintFenceFiles = process.argv.includes(
    `--${NamedArgs.LintFenceFiles}`,
  )
    ? argv[NamedArgs.LintFenceFiles]
    : !/dev/iu.test(entryTask);

  const policyOnly = argv[NamedArgs.PolicyOnly];

  const version = getVersion(buildType, buildVersion);

  return {
    // Should we apply LavaMoat to the build output?
    applyLavaMoat: argv[NamedArgs.ApplyLavaMoat],
    buildType,
    entryTask,
    // Is this process running in lavamoat-node?
    isLavaMoat: process.argv[0].includes('lavamoat'),
    policyOnly,
    shouldIncludeLockdown: argv[NamedArgs.Lockdown],
    shouldLintFenceFiles,
    skipStats: argv[NamedArgs.SkipStats],
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
