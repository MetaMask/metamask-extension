//
// build task definitions
//
// run any task with "yarn build ${taskName}"
//
const livereload = require('gulp-livereload');
const {
  createTask,
  composeSeries,
  composeParallel,
  detectAndRunEntryTask,
} = require('./task');
const createManifestTasks = require('./manifest');
const createScriptTasks = require('./scripts');
const createStyleTasks = require('./styles');
const createStaticAssetTasks = require('./static');
const createEtcTasks = require('./etc');

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

const browserPlatforms = ['firefox', 'chrome', 'brave', 'opera'];

defineAllTasks();
detectAndRunEntryTask();

function defineAllTasks() {
  const staticTasks = createStaticAssetTasks({ livereload, browserPlatforms });
  const manifestTasks = createManifestTasks({ browserPlatforms });
  const styleTasks = createStyleTasks({ livereload });
  const scriptTasks = createScriptTasks({ livereload, browserPlatforms });
  const { clean, reload, zip } = createEtcTasks({
    livereload,
    browserPlatforms,
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
}
