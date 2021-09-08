//
// build task definitions
//
// run any task with "yarn build ${taskName}"
//
const livereload = require('gulp-livereload');
const minimist = require('minimist');
const { version } = require('../../package.json');
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
const { getNextBetaVersionMap } = require('./utils');

// packages required dynamically via browserify configuration in dependencies
require('loose-envify');
require('@babel/plugin-proposal-object-rest-spread');
require('@babel/plugin-transform-runtime');
require('@babel/plugin-proposal-class-properties');
require('@babel/plugin-proposal-optional-chaining');
require('@babel/plugin-proposal-nullish-coalescing-operator');
require('@babel/preset-env');
require('@babel/preset-react');
require('@babel/core');

defineAndRunBuildTasks();

function defineAndRunBuildTasks() {
  const {
    betaVersion,
    entryTask,
    isBeta,
    shouldIncludeLockdown,
    skipStats,
  } = parseArgv();

  const browserPlatforms = ['firefox', 'chrome', 'brave', 'opera'];

  let betaVersionsMap;
  if (isBeta) {
    betaVersionsMap = getNextBetaVersionMap(
      version,
      betaVersion,
      browserPlatforms,
    );
  }

  const staticTasks = createStaticAssetTasks({
    livereload,
    browserPlatforms,
    shouldIncludeLockdown,
    isBeta,
  });

  const manifestTasks = createManifestTasks({
    browserPlatforms,
    betaVersionsMap,
    isBeta,
  });

  const styleTasks = createStyleTasks({ livereload });

  const scriptTasks = createScriptTasks({
    livereload,
    browserPlatforms,
  });

  const { clean, reload, zip } = createEtcTasks({
    livereload,
    browserPlatforms,
    betaVersionsMap,
    isBeta,
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
    BetaVersion: 'beta-version',
    BuildType: 'build-type',
    OmitLockdown: 'omit-lockdown',
    SkipStats: 'skip-stats',
  };

  const argv = minimist(process.argv.slice(2), {
    boolean: [NamedArgs.OmitLockdown, NamedArgs.SkipStats],
    string: [NamedArgs.BuildType],
    default: {
      [NamedArgs.BetaVersion]: 0,
      [NamedArgs.BuildType]: 'main',
      [NamedArgs.OmitLockdown]: false,
      [NamedArgs.SkipStats]: false,
    },
  });

  if (argv._.length !== 1) {
    throw new Error(
      `Metamask build: Expected a single positional argument. Received: ${argv._.length}`,
    );
  }

  const entryTask = argv._[0];
  if (!entryTask) {
    throw new Error('MetaMask build: No entry task specified.');
  }

  // The entry task should never be prefixed with '-' or '--', so that is easily
  // distinguishable from other arguments.
  if (entryTask.startsWith('-')) {
    throw new Error(`MetaMask build: invalid entry task: ${entryTask}`);
  }

  const betaVersion = argv[NamedArgs.BetaVersion];
  if (!Number.isInteger(betaVersion) || betaVersion < 0) {
    throw new Error(`MetaMask build: Invalid beta version: ${betaVersion}`);
  }

  // Arguments that are used throughout or deeply within the build system are
  // set as environment variables.
  setImmutableProperties(process.env, [
    ['BUILD_TYPE', argv[NamedArgs.BuildType]],
    ['IS_LAVAMOAT', String(process.argv[0].includes('lavamoat'))],
  ]);

  return {
    betaVersion: String(betaVersion),
    entryTask,
    isBeta: argv[NamedArgs.BuildType] === 'beta',
    shouldIncludeLockdown: argv[NamedArgs.OmitLockdown],
    skipStats: argv[NamedArgs.SkipStats],
  };
}

function setImmutableProperties(object, keyValueTuples) {
  const descriptors = {
    enumerable: true,
    configurable: false,
    writable: false,
  };

  Object.defineProperties(
    object,
    keyValueTuples.reduce((propertyMap, [key, value]) => {
      propertyMap[key] = {
        value,
        ...descriptors,
      };
      return propertyMap;
    }, {}),
  );
}
