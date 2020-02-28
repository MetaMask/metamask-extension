const fs = require('fs')
const fsAsync = fs.promises
const watchify = require('watchify')
const browserify = require('browserify')
const envify = require('envify/custom')
const gulp = require('gulp')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const log = require('fancy-log')
const watch = require('gulp-watch')
const sourcemaps = require('gulp-sourcemaps')
const zip = require('gulp-zip')
const { assign } = require('lodash')
const livereload = require('gulp-livereload')
const del = require('del')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const gulpStylelint = require('gulp-stylelint')
const terser = require('gulp-terser-js')
const pify = require('pify')
const rtlcss = require('gulp-rtlcss')
const rename = require('gulp-rename')
const endOfStream = pify(require('end-of-stream'))
const sesify = require('sesify')
// const imagemin = require('gulp-imagemin')
const { makeStringTransform } = require('browserify-transform-tools')
const clone = require('clone')
const mergeDeep = require('merge-deep')
const pump = require('pump')
const mkdirp = require('mkdirp')
const packageJSON = require('./package.json')
const baseManifest = require('./app/manifest/_base.json')
const { createTask, taskSeries, taskParallel, runTask } = require('./development/build/task')

sass.compiler = require('node-sass')

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

const browserPlatforms = [
  'firefox',
  'chrome',
  'brave',
  'opera',
]

//
// tasks
//

createTask('clean', () => {
  return del(['./dist/*'])
})

// browser reload

createTask('reload', function devReload () {
  livereload.listen({ port: 35729 })
})


// manifest tinkering

createTask('manifest:prod', async () => {
  return Promise.all(browserPlatforms.map(async (platform) => {
    const platformModifications = require(`./app/manifest/${platform}.json`)
    const result = mergeDeep(clone(baseManifest), platformModifications)
    const dir = `./dist/${platform}`
    await mkdirp(dir)
    await writeJson(result, `${dir}/manifest.json`)
  }))
})

const scriptsToExcludeFromBackgroundDevBuild = {
  'bg-libs.js': true,
}

// dev: remove bg-libs, add chromereload, add perms
createTask('manifest:env:dev', createTaskForModifyManifestForEnvironment(function (manifest) {
  const scripts = manifest.background.scripts.filter((scriptName) => !scriptsToExcludeFromBackgroundDevBuild[scriptName])
  scripts.push('chromereload.js')
  manifest.background = {
    ...manifest.background,
    scripts,
  }
  manifest.permissions = [...manifest.permissions, 'webRequestBlocking']
}))

// testing-local: remove bg-libs, add perms
createTask('manifest:env:testing-local', createTaskForModifyManifestForEnvironment(function (manifest) {
  const scripts = manifest.background.scripts.filter((scriptName) => !scriptsToExcludeFromBackgroundDevBuild[scriptName])
  scripts.push('chromereload.js')
  manifest.background = {
    ...manifest.background,
    scripts,
  }
  manifest.permissions = [...manifest.permissions, 'webRequestBlocking', 'http://localhost/*']
}))

// testing: add permissions
createTask('manifest:env:testing', createTaskForModifyManifestForEnvironment(function (manifest) {
  manifest.permissions = [...manifest.permissions, 'webRequestBlocking', 'http://localhost/*']
}))

// high level manifest tasks
createTask('manifest:dev', taskSeries(
  'manifest:prod',
  'manifest:env:dev',
))

createTask('manifest:testing-local', taskSeries(
  'manifest:prod',
  'manifest:env:testing-local',
))

createTask('manifest:testing', taskSeries(
  'manifest:prod',
  'manifest:env:testing',
))

// helper for modifying each platform's manifest.json in place
function createTaskForModifyManifestForEnvironment (transformFn) {
  return () => {
    return Promise.all(platforms.map(async (platform) => {
      const path = `./dist/firefox/manifest.json`
      const manifest = await readJson(path)
      transformFn(manifest)
      await writeJson(mainfest, path)
    }))
  }
}

// helper for reading and deserializing json from fs
async function readJson (path) {
  return JSON.parse(await fsAsync.readFile(path, 'utf8'))
}

// helper for serializing and writing json to fs
async function writeJson (obj, path) {
  return fsAsync.writeFile(path, JSON.stringify(obj, null, 2))
}


// copy universal

const copyTargets = [
  {
    src: `./app/_locales/`,
    dest: `_locales`,
  },
  {
    src: `./app/images/`,
    dest: `images`,
  },
  {
    src: `./node_modules/eth-contract-metadata/images/`,
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
    src: `./ui/app/css/output/`,
    dest: ``,
  },
  {
    src: `./app/`,
    pattern: `/*.html`,
    dest: ``,
  },
]

const copyTargetsDev = [
  ...copyTargets,
  {
    src: './app/scripts/',
    pattern: '/chromereload.js',
    dest: ``,
  },
]

// static assets

createTask('copy:prod', taskParallel(...copyTargets.map(target => {
  return function copyStaticAssets () { return performCopy(target) }
})))
createTask('copy:dev', taskParallel(...copyTargetsDev.map(target => {
  return function copyStaticAssets () { return performCopy(target) }
})))

function performCopy (target) {
  // stream from source
  const pattern = target.pattern || '/**/*'
  let stream = gulp.src(target.src + pattern, { base: target.src })
  // copy to destinations
  const destinations = browserPlatforms.map(platform => `./dist/${platform}/${target.dest}`)
  destinations.forEach(function (destination) {
    stream = stream.pipe(gulp.dest(destination))
  })
  return stream
}

// createTask('optimize:images', function () {
//   return gulp.src('./dist/**/images/**', { base: './dist/' })
//     .pipe(imagemin())
//     .pipe(gulp.dest('./dist/', { overwrite: true }))
// })

// scss compilation and autoprefixing tasks

createTask('build:scss', createScssBuildTask({
  src: 'ui/app/css/index.scss',
  dest: 'ui/app/css/output',
  devMode: false,
}))

createTask('dev:scss', createScssBuildTask({
  src: 'ui/app/css/index.scss',
  dest: 'ui/app/css/output',
  devMode: true,
  pattern: 'ui/app/**/*.scss',
}))

function createScssBuildTask ({ src, dest, devMode, pattern }) {
  return function () {
    if (devMode) {
      watch(pattern, async (event) => {
        const stream = buildScss(devMode)
        await endOfStream(stream)
        livereload.changed(event.path)
      })
    }
    return buildScss(devMode)
  }

  function buildScss (devMode) {
    return pump(...[
      // pre-process
      gulp.src(src),
      devMode && sourcemaps.init(),
      sass().on('error', sass.logError),
      devMode && sourcemaps.write(),
      autoprefixer(),
      // standard
      gulp.dest(dest),
      // right-to-left
      rtlcss(),
      rename({ suffix: '-rtl' }),
      devMode && sourcemaps.write(),
      gulp.dest(dest),
    ].filter(Boolean))
  }
}

createTask('lint-scss', function () {
  return gulp
    .src('ui/app/css/itcss/**/*.scss')
    .pipe(gulpStylelint({
      reporters: [
        { formatter: 'string', console: true },
      ],
      fix: true,
    }))
})

// build js

const buildJsFiles = [
  'inpage',
  'contentscript',
  'background',
  'ui',
  'phishing-detect',
]

// bundle tasks
createTasksForBuildJsDeps({ filename: 'bg-libs', key: 'background' })
createTasksForBuildJsDeps({ filename: 'ui-libs', key: 'ui' })
createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'dev:extension:js', devMode: true })
createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'dev:test-extension:js', devMode: true, testing: 'true' })
createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'build:extension:js' })
createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'build:test:extension:js', testing: 'true' })

function createTasksForBuildJsDeps ({ key, filename }) {
  const destinations = browserPlatforms.map((platform) => `./dist/${platform}`)

  const bundleTaskOpts = Object.assign({
    buildSourceMaps: true,
    sourceMapDir: '../sourcemaps',
    minifyBuild: true,
    devMode: false,
  })

  createTask(`build:extension:js:deps:${key}`, bundleTask(Object.assign({
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

// zip tasks for distribution
createTask('zip:chrome', zipTask('chrome'))
createTask('zip:firefox', zipTask('firefox'))
createTask('zip:opera', zipTask('opera'))
createTask('zip', taskParallel('zip:chrome', 'zip:firefox', 'zip:opera'))

// high level tasks

createTask('dev:test',
  taskSeries(
    'clean',
    'dev:scss',
    taskParallel(
      'dev:test-extension:js',
      'copy:dev',
      'manifest:testing',
      'reload',
    )
  )
)

createTask('dev:extension',
  taskSeries(
    'clean',
    'dev:scss',
    taskParallel(
      'dev:extension:js',
      'copy:dev',
      'manifest:dev',
      'reload'
    )
  )
)

createTask('build',
  taskSeries(
    'clean',
    'build:scss',
    taskParallel(
      'build:extension:js:deps:background',
      'build:extension:js:deps:ui',
      'build:extension:js',
      'copy:prod',
      'manifest:prod',
    ),
    // 'optimize:images'
  )
)

createTask('build:test',
  taskSeries(
    'clean',
    'build:scss',
    taskParallel(
      'build:extension:js:deps:background',
      'build:extension:js:deps:ui',
      'build:test:extension:js',
      'copy:prod',
      'manifest:testing',
    ),
  )
)

createTask('dist',
  taskSeries(
    'build',
    'zip',
  )
)

// task generators

function zipTask (target) {
  return () => {
    return gulp.src(`dist/${target}/**`)
      .pipe(zip(`metamask-${target}-${baseManifest.version}.zip`))
      .pipe(gulp.dest('builds'))
  }
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

function beep () {
  process.stdout.write('\x07')
}


// temp
runTask('dist')