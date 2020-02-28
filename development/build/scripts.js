const gulp = require('gulp')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const log = require('fancy-log')
const { assign } = require('lodash')
const watchify = require('watchify')
const browserify = require('browserify')
const envify = require('envify/custom')
const sourcemaps = require('gulp-sourcemaps')
const sesify = require('sesify')
const terser = require('gulp-terser-js')
const { makeStringTransform } = require('browserify-transform-tools')


const { createTask, taskParallel, taskSeries } = require('./task')
const packageJSON = require('../../package.json')

module.exports = createScriptTasks


const dependencies = Object.keys((packageJSON && packageJSON.dependencies) || {})
const materialUIDependencies = ['@material-ui/core']
const reactDepenendencies = dependencies.filter((dep) => dep.match(/react/))
const d3Dependencies = ['c3', 'd3']

const externalDependenciesMap = {
  background: [
    '3box',
  ],
  ui: [
    ...materialUIDependencies, ...reactDepenendencies, ...d3Dependencies,
  ],
}

// build js
const buildJsFiles = [
  'inpage',
  'contentscript',
  'background',
  'ui',
  'phishing-detect',
]

function createScriptTasks ({ browserPlatforms }) {

  // bundle tasks
  createTasksForBuildJsDeps({ filename: 'bg-libs', key: 'background' })
  createTasksForBuildJsDeps({ filename: 'ui-libs', key: 'ui' })
  createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'scripts:core:dev', devMode: true })
  createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'scripts:core:prod' })
  createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'scripts:core:test', testing: 'true' })
  createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'scripts:core:test-live', testing: 'true', devMode: true })

  function createTasksForBuildJsDeps ({ key, filename }) {
    const destinations = browserPlatforms.map((platform) => `./dist/${platform}`)

    const bundleTaskOpts = Object.assign({
      buildSourceMaps: true,
      sourceMapDir: '../sourcemaps',
      minifyBuild: true,
      devMode: false,
    })

    createTask(`scripts:deps:${key}`, bundleTask(Object.assign({
      label: filename,
      filename: `${filename}.js`,
      destinations,
      buildLib: true,
      dependenciesToBundle: externalDependenciesMap[key],
    }, bundleTaskOpts)))
  }


  function createTasksForBuildJsExtension ({ buildJsFiles, taskPrefix, devMode, testing, bundleTaskOpts = {} }) {
    // inpage must be built before all other scripts:
    const rootDir = './app/scripts'
    const nonInpageFiles = buildJsFiles.filter((file) => file !== 'inpage')
    const buildPhase1 = ['inpage']
    const buildPhase2 = nonInpageFiles
    const destinations = browserPlatforms.map((platform) => `./dist/${platform}`)
    bundleTaskOpts = Object.assign({
      buildSourceMaps: true,
      sourceMapDir: '../sourcemaps',
      minifyBuild: !devMode,
      buildWithFullPaths: devMode,
      watch: devMode,
      devMode,
      testing,
    }, bundleTaskOpts)
    createTasksForBuildJs({ rootDir, taskPrefix, bundleTaskOpts, destinations, buildPhase1, buildPhase2 })
  }

  function createTasksForBuildJs ({ rootDir, taskPrefix, bundleTaskOpts, destinations, buildPhase1 = [], buildPhase2 = [] }) {
    // bundle task for each file
    const jsFiles = [].concat(buildPhase1, buildPhase2)
    jsFiles.forEach((jsFile) => {
      createTask(`${taskPrefix}:${jsFile}`, bundleTask(Object.assign({
        label: jsFile,
        filename: `${jsFile}.js`,
        filepath: `${rootDir}/${jsFile}.js`,
        externalDependencies: bundleTaskOpts.devMode ? undefined : externalDependenciesMap[jsFile],
        destinations,
      }, bundleTaskOpts)))
    })
    // compose into larger task
    const subtasks = []
    subtasks.push(taskParallel(...buildPhase1.map((file) => `${taskPrefix}:${file}`)))
    if (buildPhase2.length) {
      subtasks.push(taskParallel(...buildPhase2.map((file) => `${taskPrefix}:${file}`)))
    }

    createTask(taskPrefix, taskSeries(...subtasks))
  }


  function bundleTask (opts) {
    let bundler

    return performBundle

    function performBundle () {
      // initialize bundler if not available yet
      // dont create bundler until task is actually run
      if (!bundler) {
        bundler = generateBundler(opts, performBundle)
        // output build logs to terminal
        bundler.on('log', log)
      }

      let buildStream = bundler.bundle()

      // handle errors
      buildStream.on('error', (err) => {
        beep()
        if (opts.watch) {
          console.warn(err.stack)
        } else {
          throw err
        }
      })

      // process bundles
      buildStream = buildStream
        // convert bundle stream to gulp vinyl stream
        .pipe(source(opts.filename))
        // buffer file contents (?)
        .pipe(buffer())

      // Initialize Source Maps
      if (opts.buildSourceMaps) {
        buildStream = buildStream
          // loads map from browserify file
          .pipe(sourcemaps.init({ loadMaps: true }))
      }

      // Minification
      if (opts.minifyBuild) {
        buildStream = buildStream
          .pipe(terser({
            mangle: {
              reserved: [ 'MetamaskInpageProvider' ],
            },
          }))
      }

      // Finalize Source Maps
      if (opts.buildSourceMaps) {
        if (opts.devMode) {
          // Use inline source maps for development due to Chrome DevTools bug
          // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
          buildStream = buildStream
            .pipe(sourcemaps.write())
        } else {
          buildStream = buildStream
            .pipe(sourcemaps.write(opts.sourceMapDir))
        }
      }

      // write completed bundles
      opts.destinations.forEach((dest) => {
        buildStream = buildStream.pipe(gulp.dest(dest))
      })

      return buildStream

    }
  }

  function configureBundleForSesify ({
    browserifyOpts,
    bundleName,
  }) {
    // add in sesify args for better globalRef usage detection
    Object.assign(browserifyOpts, sesify.args)

    // ensure browserify uses full paths
    browserifyOpts.fullPaths = true

    // record dependencies used in bundle
    fs.mkdirSync('./sesify', { recursive: true })
    browserifyOpts.plugin.push(['deps-dump', {
      filename: `./sesify/deps-${bundleName}.json`,
    }])

    const sesifyConfigPath = `./sesify/${bundleName}.json`

    // add sesify plugin
    browserifyOpts.plugin.push([sesify, {
      writeAutoConfig: sesifyConfigPath,
    }])

    // remove html comments that SES is alergic to
    const removeHtmlComment = makeStringTransform('remove-html-comment', { excludeExtension: ['.json'] }, (content, _, cb) => {
      const result = content.split('-->').join('-- >')
      cb(null, result)
    })
    browserifyOpts.transform.push([removeHtmlComment, { global: true }])
  }

  function generateBundler (opts, performBundle) {
    const browserifyOpts = assign({}, watchify.args, {
      plugin: [],
      transform: [],
      debug: opts.buildSourceMaps,
      fullPaths: opts.buildWithFullPaths,
    })

    const bundleName = opts.filename.split('.')[0]

    // activate sesify
    const activateAutoConfig = Boolean(process.env.SESIFY_AUTOGEN)
    // const activateSesify = activateAutoConfig
    const activateSesify = activateAutoConfig && ['background'].includes(bundleName)
    if (activateSesify) {
      configureBundleForSesify({ browserifyOpts, bundleName })
    }

    if (!activateSesify) {
      browserifyOpts.plugin.push('browserify-derequire')
    }

    if (!opts.buildLib) {
      if (opts.devMode && opts.filename === 'ui.js') {
        browserifyOpts['entries'] = ['./development/require-react-devtools.js', opts.filepath]
      } else {
        browserifyOpts['entries'] = [opts.filepath]
      }
    }

    let bundler = browserify(browserifyOpts)
      .transform('babelify')
      // Transpile any dependencies using the object spread/rest operator
      // because it is incompatible with `esprima`, which is used by `envify`
      // See https://github.com/jquery/esprima/issues/1927
      .transform('babelify', {
        only: [
          './**/node_modules/libp2p',
        ],
        global: true,
        plugins: ['@babel/plugin-proposal-object-rest-spread'],
      })
      .transform('brfs')

    if (opts.buildLib) {
      bundler = bundler.require(opts.dependenciesToBundle)
    }

    if (opts.externalDependencies) {
      bundler = bundler.external(opts.externalDependencies)
    }

    let environment
    if (opts.devMode) {
      environment = 'development'
    } else if (opts.testing) {
      environment = 'testing'
    } else if (process.env.CIRCLE_BRANCH === 'master') {
      environment = 'production'
    } else if (/^Version-v(\d+)[.](\d+)[.](\d+)/.test(process.env.CIRCLE_BRANCH)) {
      environment = 'release-candidate'
    } else if (process.env.CIRCLE_BRANCH === 'develop') {
      environment = 'staging'
    } else if (process.env.CIRCLE_PULL_REQUEST) {
      environment = 'pull-request'
    } else {
      environment = 'other'
    }

    // Inject variables into bundle
    bundler.transform(envify({
      METAMASK_DEBUG: opts.devMode,
      METAMASK_ENVIRONMENT: environment,
      NODE_ENV: opts.devMode ? 'development' : 'production',
      IN_TEST: opts.testing,
      PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY || '',
      PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY || '',
    }), {
      global: true,
    })

    if (opts.watch) {
      bundler = watchify(bundler)
      // on any file update, re-runs the bundler
      bundler.on('update', async (ids) => {
        const stream = performBundle()
        await endOfStream(stream)
        livereload.changed(`${ids}`)
      })
    }

    return bundler
  }


}


function beep () {
  process.stdout.write('\x07')
}
