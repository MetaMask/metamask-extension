const gulp = require('gulp')
const watch = require('gulp-watch')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const EventEmitter = require('events')
const log = require('fancy-log')
const browserify = require('browserify')
const envify = require('envify/custom')
const sourcemaps = require('gulp-sourcemaps')
const terser = require('gulp-terser-js')
const rename = require('gulp-rename')
const pify = require('pify')
const endOfStream = pify(require('end-of-stream'))
const labeledStreamSplicer = require('labeled-stream-splicer').obj
const createLavamoatPacker = require('lavamoat-browserify/src/createCustomPack')
const lavamoatArgs = require('lavamoat-browserify').args
const { createTask, composeParallel, composeSeries, runInChildProcess } = require('./task')
const { promises: fs } = require('fs')

const conf = require('rc')('metamask', {})

module.exports = createScriptTasks


function createScriptTasks ({ browserPlatforms, livereload }) {

  const prod = createBundleTasks('prod')
  const dev = createBundleTasks('dev', { devMode: true, livereload })
  const testDev = createBundleTasks('testDev', { test: true, devMode: true, livereload })
  const test = createBundleTasks('test', { test: true })
  const lavamoat = createLavamoatTask('lavamoat:dashboard')

  return { prod, dev, testDev, test, lavamoat }


  function createBundleTasks (label, { devMode, test, livereload } = {}) {
    const primaryBundlesTask = createTask(`scripts:${label}:factor`, createFactorBundles({ test, devMode }))
    const contentscriptTask = createTask(`scripts:${label}:contentscript`, createBuildContentscriptTask({ test, devMode }))
    const phishingDetectTask = createTask(`scripts:${label}:phishingDetect`, createBuildPhishingDetectTask({ test, devMode }))
    return createTask(`scripts:${label}`, composeParallel(...[
      runInChildProcess(primaryBundlesTask),
      runInChildProcess(contentscriptTask),
      runInChildProcess(phishingDetectTask),
      devMode && initiateLiveReload({ livereload }),
    ].filter(Boolean)))
  }

  // task for initiating livereload
  function initiateLiveReload ({ livereload }) {
    return () => {
      // trigger live reload when the bundles are updated
      // this is not ideal, but overcomes the limitations:
      // - run from the main process (not child process tasks)
      // - after the first build has completed (thus the timeout)
      // - build tasks never "complete" when run with livereload + child process
      setTimeout(() => {
        watch('./dist/*/*.js', (event) => {
          livereload.changed(event.path)
        })
      }, 75e3)
    }
  }

  function createBuildPhishingDetectTask ({ devMode, testing } = {}) {
    return createNormalBundle({
      destName: `phishing-detect.js`,
      srcPath: `./app/scripts/phishing-detect.js`,
      devMode,
      testing,
      watchify: devMode,
    })
  }

  function createBuildContentscriptTask ({ devMode, testing } = {}) {
    // inpage must be built first so it can be inserted into contentscript
    const inpage = 'inpage'
    const contentscript = 'contentscript'
    return composeSeries(
      createNormalBundle({
        destName: `${inpage}.js`,
        srcPath: `./app/scripts/${inpage}.js`,
        devMode,
        testing,
        watchify: false,
      }),
      createNormalBundle({
        destName: `${contentscript}.js`,
        srcPath: `./app/scripts/${contentscript}.js`,
        devMode,
        testing,
        watchify: devMode,
      }),
    )
  }

  function createFactorBundles ({ devMode, test } = {}) {
    return async function buildFactor () {
      // create bundler setup and apply defaults
      const { bundlerOpts, events } = createBundlerSetup()
      setupBundlerDefaults({ bundlerOpts, events, devMode, test, watchify: devMode })

      // add factor-bundle specific options
      Object.assign(bundlerOpts, {
        // ui + background, bify-package-factor will split into separate bundles
        entries: ['app/scripts/ui.js', 'app/scripts/background.js'],
        // dedupe breaks under bundle factoring
        dedupe: false,
        plugin: [
          ...bundlerOpts.plugin,
          // factor code into multiple bundles and emit as vinyl file objects
          'bify-package-factor',
        ],
      })

      // instrument build pipeline
      events.on('pipeline', (pipeline) => {
        // rename file. we put it here so sourcemaps first load correctly
        pipeline.get('sourcemaps:write').unshift(rename((path) => {
          // remove relative directory from source
          path.dirname = '.'
        }))
        // setup bundle destination
        browserPlatforms.forEach((platform) => {
          const dest = `./dist/${platform}`
          pipeline.get('dest').push(gulp.dest(dest))
        })
      })

      await executeBundle({ bundlerOpts, events })
    }
  }

  function createNormalBundle ({ destName, srcPath, devMode, test, watchify }) {
    return async function () {

      // create bundler setup and apply defaults
      const { bundlerOpts, events } = createBundlerSetup()
      setupBundlerDefaults({ bundlerOpts, events, devMode, test, watchify })

      // set bundle entry file
      bundlerOpts.entries = [srcPath]

      // instrument pipeline
      events.on('pipeline', (pipeline) => {
        // convert bundle stream to gulp vinyl stream
        pipeline.get('vinyl').push(
          source(destName),
        )
        // setup bundle destination
        browserPlatforms.forEach((platform) => {
          const dest = `./dist/${platform}/`
          pipeline.get('dest').push(gulp.dest(dest))
        })
      })

      await executeBundle({ bundlerOpts, events })
    }
  }

  function createLavamoatTask (label) {
    return createTask(label, async function () {
      // create bundler setup and apply defaults
      const { bundlerOpts, events } = createBundlerSetup()
      setupBundlerDefaults({ bundlerOpts, events })

      // add factor-bundle specific options
      Object.assign(bundlerOpts, {
        // add recommended lavamoat args
        ...lavamoatArgs,
        // ui + background, bify-package-factor will split into separate bundles
        entries: ['app/scripts/ui.js', 'app/scripts/background.js'],
        // dedupe breaks under bundle factoring
        dedupe: false,
        plugin: [
          ...bundlerOpts.plugin,
          // add lavamoat for global usage detection
          ['lavamoat-browserify', {
            config: './dist/lavamoat/lavamoat-config.json',
            writeAutoConfig: true,
          }],
          // factor code into multiple bundles and emit as vinyl file objects
          ['bify-package-factor', {
            createPacker: () => {
              return createLavamoatPacker({
                raw: true,
                config: {},
                includePrelude: false,
              })
            },
          }],
          // record dep graph across factored bundles
          ['deps-dump', {
            filename: `./dist/lavamoat/deps.json`,
          }],
        ],
      })

      // we dont add a destination for the build pipeline
      // because we ignore the bundle output

      // record dependencies used in bundle
      await fs.mkdir('./dist/lavamoat', { recursive: true })
      await executeBundle({ bundlerOpts, events })
    })
  }

}

function createBundlerSetup () {
  const events = new EventEmitter()
  const bundlerOpts = {
    entries: [],
    transform: [],
    plugin: [],
  }
  return { bundlerOpts, events }
}

function setupBundlerDefaults ({ bundlerOpts, events, devMode, test, watchify }) {
  // enabling some general options
  Object.assign(bundlerOpts, {
    // source transforms
    transform: [
      // transpile top-level code
      'babelify',
      // inline `fs.readFileSync` files
      'brfs',
    ],
    // use filepath for moduleIds, easier to determine origin file
    fullPaths: devMode,
  })
  // setup minification
  if (!devMode) {
    setupMinification({ bundlerOpts, events })
  }
  // inject environment variables
  setupEnvVarInjection({ bundlerOpts, events, devMode, test })
  // setup watchify
  if (watchify) {
    setupWatchify({ bundlerOpts, events })
  }
  // setup sourcemaps, write location depends on devMode
  setupSourcemaps({ bundlerOpts, events, devMode })
}

function executeBundle ({ bundlerOpts, events }) {
  const bundler = browserify(bundlerOpts)
  // output build logs to terminal
  bundler.on('log', log)
  // forward update event (used by watchify)
  bundler.on('update', performBundle)
  return performBundle()

  async function performBundle () {
    const pipeline = labeledStreamSplicer([
      // ensure browserify output is vinyl (for bify-package-factor, it already is)
      'vinyl', [],
      // load sourcemaps
      'sourcemaps:init', [],
      // apply post-bundle transformations
      'minify', [],
      // sourcemaps written to disk
      'sourcemaps:write', [],
      // completed, write content to disk
      'dest', [],
    ])
    const bundleStream = bundler.bundle()
    // trigger build pipeline instrumentations
    events.emit('pipeline', pipeline, bundleStream)
    // start bundle, send into pipeline
    bundleStream.pipe(pipeline)
    // nothing will consume pipeline, so let it flow
    pipeline.resume()
    await endOfStream(pipeline)
  }
}

function setupWatchify ({ bundlerOpts, events }) {
  // add plugin to options
  Object.assign(bundlerOpts, {
    plugin: [
      ...bundlerOpts.plugin,
      'watchify',
    ],
    // required by watchify
    cache: {},
    packageCache: {},
  })
  // instrument pipeline
  events.on('pipeline', (_, bundleStream) => {
    // handle build error to avoid breaking build process
    bundleStream.on('error', (err) => {
      beep()
      console.warn(err.stack)
    })
  })
}

function setupSourcemaps ({ bundlerOpts, events, devMode }) {
  // tell browserify to generate sourcemaps
  bundlerOpts.debug = true

  // instrument pipeline
  events.on('pipeline', (pipeline) => {

    // initialize source maps, gulp-sourcemaps requires files to be buffered
    pipeline.get('sourcemaps:init').push(buffer())
    pipeline.get('sourcemaps:init').push(
      sourcemaps.init({ loadMaps: true }),
    )

    // write sourcemaps
    if (devMode) {
      // Use inline source maps for development due to Chrome DevTools bug
      // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
      pipeline.get('sourcemaps:write').push(sourcemaps.write())
    } else {
      pipeline.get('sourcemaps:write').push(sourcemaps.write('../sourcemaps', { addComment: false }))
    }

  })
}

function setupEnvVarInjection ({ bundlerOpts, devMode, test }) {
  const environment = getEnvironment({ devMode, test })
  if (environment === 'production' && !process.env.SENTRY_DSN) {
    throw new Error('Missing SENTRY_DSN environment variable')
  }
  Object.assign(bundlerOpts, {
    transform: [
      ...bundlerOpts.transform,
      // transpile specified dependencies using the object spread/rest operator
      // because it is incompatible with `esprima`, which is used by `envify`
      // See https://github.com/jquery/esprima/issues/1927
      ['babelify', {
        only: [
          './**/node_modules/libp2p',
        ],
        global: true,
        plugins: ['@babel/plugin-proposal-object-rest-spread'],
      }],
      // inject environment variables
      [envify({
        METAMASK_DEBUG: devMode,
        METAMASK_ENVIRONMENT: environment,
        METAMETRICS_PROJECT_ID: process.env.METAMETRICS_PROJECT_ID,
        NODE_ENV: devMode ? 'development' : 'production',
        IN_TEST: test ? 'true' : false,
        PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY || '',
        PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY || '',
        ETH_GAS_STATION_API_KEY: process.env.ETH_GAS_STATION_API_KEY || '',
        CONF: devMode ? conf : ({}),
        SENTRY_DSN: process.env.SENTRY_DSN,
      }), {
        global: true,
      }],
    ],
  })
}

function setupMinification ({ events }) {
  // instrument pipeline
  events.on('pipeline', (pipeline) => {
    // must ensure vinyl file objects are buffered first
    pipeline.get('minify').push(buffer())
    // apply terser
    pipeline.get('minify').push(terser({
      mangle: {
        reserved: [ 'MetamaskInpageProvider' ],
      },
      sourceMap: {
        content: true,
      },
    }))
  })
}

function beep () {
  process.stdout.write('\x07')
}

function getEnvironment ({ devMode, test }) {
  // get environment slug
  if (devMode) {
    return 'development'
  } else if (test) {
    return 'testing'
  } else if (process.env.CIRCLE_BRANCH === 'master') {
    return 'production'
  } else if (/^Version-v(\d+)[.](\d+)[.](\d+)/.test(process.env.CIRCLE_BRANCH)) {
    return 'release-candidate'
  } else if (process.env.CIRCLE_BRANCH === 'develop') {
    return 'staging'
  } else if (process.env.CIRCLE_PULL_REQUEST) {
    return 'pull-request'
  } else {
    return 'other'
  }
}
