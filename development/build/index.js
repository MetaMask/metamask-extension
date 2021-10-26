//
// build task definitions
//
// run any task with "yarn build ${taskName}"
//
const livereload = require('gulp-livereload');
const minimist = require('minimist');
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
const { BuildType, getBrowserVersionMap } = require('./utils');

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
    buildType,
    entryTask,
    isLavaMoat,
    shouldIncludeLockdown,
    shouldLintFenceFiles,
    skipStats,
  } = parseArgv();

  const browserPlatforms = ['firefox', 'chrome', 'brave', 'opera'];

  const browserVersionMap = getBrowserVersionMap(browserPlatforms);

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
    browserPlatforms,
    buildType,
    isLavaMoat,
    livereload,
    shouldLintFenceFiles,
  });

  const { clean, reload, zip } = createEtcTasks({
    livereload,
    browserPlatforms,
    buildType,
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
    BuildType: 'build-type',
    LintFenceFiles: 'lint-fence-files',
    OmitLockdown: 'omit-lockdown',
    SkipStats: 'skip-stats',
  };

  const argv = minimist(process.argv.slice(2), {
    boolean: [
      NamedArgs.LintFenceFiles,
      NamedArgs.OmitLockdown,
      NamedArgs.SkipStats,
    ],
    string: [NamedArgs.BuildType],
    default: {
      [NamedArgs.BuildType]: BuildType.main,
      [NamedArgs.LintFenceFiles]: true,
      [NamedArgs.OmitLockdown]: false,
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

  // Manually default this to `false` for dev builds only.
  const shouldLintFenceFiles = process.argv.includes(
    `--${NamedArgs.LintFenceFiles}`,
  )
    ? argv[NamedArgs.LintFenceFiles]
    : !/dev/iu.test(entryTask);

  return {
    buildType,
    entryTask,
    isLavaMoat: process.argv[0].includes('lavamoat'),
    shouldIncludeLockdown: argv[NamedArgs.OmitLockdown],
    shouldLintFenceFiles,
    skipStats: argv[NamedArgs.SkipStats],
  };
}
