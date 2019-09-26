const watchify = require('watchify')
const browserify = require('browserify')
const envify = require('envify/custom')
const gulp = require('gulp')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const gutil = require('gulp-util')
const watch = require('gulp-watch')
const sourcemaps = require('gulp-sourcemaps')
const jsoneditor = require('gulp-json-editor')
const zip = require('gulp-zip')
const assign = require('lodash.assign')
const livereload = require('gulp-livereload')
const del = require('del')
const manifest = require('./app/manifest.json')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const gulpStylelint = require('gulp-stylelint')
const terser = require('gulp-terser-js')
const pify = require('pify')
const rtlcss = require('gulp-rtlcss')
const rename = require('gulp-rename')
const gulpMultiProcess = require('gulp-multi-process')
const endOfStream = pify(require('end-of-stream'))
const sesify = require('sesify')
const mkdirp = require('mkdirp')
const imagemin = require('gulp-imagemin')
const { makeStringTransform } = require('browserify-transform-tools')

const packageJSON = require('./package.json')
const dependencies = Object.keys(packageJSON && packageJSON.dependencies || {})
const materialUIDependencies = ['@material-ui/core']
const reactDepenendencies = dependencies.filter(dep => dep.match(/react/))
const d3Dependencies = ['c3', 'd3']

const externalDependenciesMap = {
  background: [
    '3box',
  ],
  ui: [
    ...materialUIDependencies, ...reactDepenendencies, ...d3Dependencies,
  ],
}

function gulpParallel (...args) {
  return function spawnGulpChildProcess (cb) {
    return gulpMultiProcess(args, cb, true)
  }
}

const browserPlatforms = [
  'firefox',
  'chrome',
  'brave',
  'opera',
]
const commonPlatforms = [
  // browser extensions
  ...browserPlatforms,
]

// browser reload

gulp.task('dev:reload', function () {
  livereload.listen({
    port: 35729,
  })
})

// copy universal

const copyTaskNames = []
const copyDevTaskNames = []

createCopyTasks('locales', {
  source: './app/_locales/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/_locales`),
})
createCopyTasks('images', {
  source: './app/images/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/images`),
})
createCopyTasks('contractImages', {
  source: './node_modules/eth-contract-metadata/images/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/images/contract`),
})
createCopyTasks('fonts', {
  source: './app/fonts/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/fonts`),
})
createCopyTasks('vendor', {
  source: './app/vendor/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/vendor`),
})
createCopyTasks('css', {
  source: './ui/app/css/output/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}`),
})
createCopyTasks('reload', {
  devOnly: true,
  source: './app/scripts/',
  pattern: '/chromereload.js',
  destinations: commonPlatforms.map(platform => `./dist/${platform}`),
})
createCopyTasks('html', {
  source: './app/',
  pattern: '/*.html',
  destinations: commonPlatforms.map(platform => `./dist/${platform}`),
})

// copy extension

createCopyTasks('manifest', {
  source: './app/',
  pattern: '/*.json',
  destinations: browserPlatforms.map(platform => `./dist/${platform}`),
})

function createCopyTasks (label, opts) {
  if (!opts.devOnly) {
    const copyTaskName = `copy:${label}`
    copyTask(copyTaskName, opts)
    copyTaskNames.push(copyTaskName)
  }
  const copyDevTaskName = `dev:copy:${label}`
  copyTask(copyDevTaskName, Object.assign({ devMode: true }, opts))
  copyDevTaskNames.push(copyDevTaskName)
}

function copyTask (taskName, opts) {
  const source = opts.source
  const destination = opts.destination
  const destinations = opts.destinations || [destination]
  const pattern = opts.pattern || '/**/*'
  const devMode = opts.devMode

  return gulp.task(taskName, function () {
    if (devMode) {
      watch(source + pattern, (event) => {
        livereload.changed(event.path)
        performCopy()
      })
    }

    return performCopy()
  })

  function performCopy () {
    // stream from source
    let stream = gulp.src(source + pattern, { base: source })

    // copy to destinations
    destinations.forEach(function (destination) {
      stream = stream.pipe(gulp.dest(destination))
    })

    return stream
  }
}

// manifest tinkering

gulp.task('manifest:chrome', function () {
  return gulp.src('./dist/chrome/manifest.json')
    .pipe(jsoneditor(function (json) {
      delete json.applications
      json.minimum_chrome_version = '58'
      return json
    }))
    .pipe(gulp.dest('./dist/chrome', { overwrite: true }))
})

gulp.task('manifest:opera', function () {
  return gulp.src('./dist/opera/manifest.json')
    .pipe(jsoneditor(function (json) {
      json.permissions = [
        'storage',
        'tabs',
        'clipboardWrite',
        'clipboardRead',
        'http://localhost:8545/',
      ]
      return json
    }))
    .pipe(gulp.dest('./dist/opera', { overwrite: true }))
})

gulp.task('manifest:production', function () {
  return gulp.src([
    './dist/firefox/manifest.json',
    './dist/chrome/manifest.json',
    './dist/brave/manifest.json',
    './dist/opera/manifest.json',
  ], {base: './dist/'})

  // Exclude chromereload script in production:
    .pipe(jsoneditor(function (json) {
      json.background.scripts = json.background.scripts.filter((script) => {
        return !script.includes('chromereload')
      })
      return json
    }))

    .pipe(gulp.dest('./dist/', { overwrite: true }))
})

gulp.task('manifest:testing', function () {
  return gulp.src([
    './dist/firefox/manifest.json',
    './dist/chrome/manifest.json',
  ], {base: './dist/'})

  // Exclude chromereload script in production:
    .pipe(jsoneditor(function (json) {
      json.permissions = [...json.permissions, 'webRequestBlocking', 'http://localhost/*']
      return json
    }))

    .pipe(gulp.dest('./dist/', { overwrite: true }))
})

const scriptsToExcludeFromBackgroundDevBuild = {
  'bg-libs.js': true,
}

gulp.task('manifest:testing-local', function () {
  return gulp.src([
    './dist/firefox/manifest.json',
    './dist/chrome/manifest.json',
  ], {base: './dist/'})

    .pipe(jsoneditor(function (json) {
      json.background = {
        ...json.background,
        scripts: json.background.scripts.filter(scriptName => !scriptsToExcludeFromBackgroundDevBuild[scriptName]),
      }
      json.permissions = [...json.permissions, 'webRequestBlocking', 'http://localhost/*']
      return json
    }))

    .pipe(gulp.dest('./dist/', { overwrite: true }))
})


gulp.task('manifest:dev', function () {
  return gulp.src([
    './dist/firefox/manifest.json',
    './dist/chrome/manifest.json',
  ], {base: './dist/'})

    .pipe(jsoneditor(function (json) {
      json.background = {
        ...json.background,
        scripts: json.background.scripts.filter(scriptName => !scriptsToExcludeFromBackgroundDevBuild[scriptName]),
      }
      json.permissions = [...json.permissions, 'webRequestBlocking']
      return json
    }))

    .pipe(gulp.dest('./dist/', { overwrite: true }))
})

gulp.task('optimize:images', function () {
  return gulp.src('./dist/**/images/**', {base: './dist/'})
    .pipe(imagemin())
    .pipe(gulp.dest('./dist/', { overwrite: true }))
})

gulp.task('copy',
  gulp.series(
    gulp.parallel(...copyTaskNames),
    'manifest:production',
    'manifest:chrome',
    'manifest:opera'
  )
)

gulp.task('dev:copy',
  gulp.series(
    gulp.parallel(...copyDevTaskNames),
    'manifest:dev',
    'manifest:chrome',
    'manifest:opera'
  )
)

gulp.task('test:copy',
  gulp.series(
    gulp.parallel(...copyDevTaskNames),
    'manifest:chrome',
    'manifest:opera',
    'manifest:testing-local'
  )
)

// scss compilation and autoprefixing tasks

gulp.task('build:scss', createScssBuildTask({
  src: 'ui/app/css/index.scss',
  dest: 'ui/app/css/output',
  devMode: false,
}))

gulp.task('dev:scss', createScssBuildTask({
  src: 'ui/app/css/index.scss',
  dest: 'ui/app/css/output',
  devMode: true,
  pattern: 'ui/app/**/*.scss',
}))

function createScssBuildTask ({ src, dest, devMode, pattern }) {
  return function () {
    if (devMode) {
      watch(pattern, async (event) => {
        const stream = buildScss()
        await endOfStream(stream)
        livereload.changed(event.path)
      })
      return buildScssWithSourceMaps()
    }
    return buildScss()
  }

  function buildScssWithSourceMaps () {
    return gulp.src(src)
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(sourcemaps.write())
      .pipe(autoprefixer())
      .pipe(gulp.dest(dest))
      .pipe(rtlcss())
      .pipe(rename({ suffix: '-rtl' }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(dest))
  }

  function buildScss () {
    return gulp.src(src)
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(gulp.dest(dest))
      .pipe(rtlcss())
      .pipe(rename({ suffix: '-rtl' }))
      .pipe(gulp.dest(dest))
  }
}

gulp.task('lint-scss', function () {
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
  const destinations = browserPlatforms.map(platform => `./dist/${platform}`)

  const bundleTaskOpts = Object.assign({
    buildSourceMaps: true,
    sourceMapDir: '../sourcemaps',
    minifyBuild: true,
    devMode: false,
  })

  gulp.task(`build:extension:js:deps:${key}`, bundleTask(Object.assign({
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
  const nonInpageFiles = buildJsFiles.filter(file => file !== 'inpage')
  const buildPhase1 = ['inpage']
  const buildPhase2 = nonInpageFiles
  const destinations = browserPlatforms.map(platform => `./dist/${platform}`)
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
    gulp.task(`${taskPrefix}:${jsFile}`, bundleTask(Object.assign({
      label: jsFile,
      filename: `${jsFile}.js`,
      filepath: `${rootDir}/${jsFile}.js`,
      externalDependencies: bundleTaskOpts.devMode ? undefined : externalDependenciesMap[jsFile],
      destinations,
    }, bundleTaskOpts)))
  })
  // compose into larger task
  const subtasks = []
  subtasks.push(gulp.parallel(buildPhase1.map(file => `${taskPrefix}:${file}`)))
  if (buildPhase2.length) subtasks.push(gulp.parallel(buildPhase2.map(file => `${taskPrefix}:${file}`)))

  gulp.task(taskPrefix, gulp.series(subtasks))
}

// clean dist

gulp.task('clean', function clean () {
  return del(['./dist/*'])
})

// zip tasks for distribution
gulp.task('zip:chrome', zipTask('chrome'))
gulp.task('zip:firefox', zipTask('firefox'))
gulp.task('zip:opera', zipTask('opera'))
gulp.task('zip', gulp.parallel('zip:chrome', 'zip:firefox', 'zip:opera'))

// high level tasks

gulp.task('dev:test',
  gulp.series(
    'clean',
    'dev:scss',
    gulp.parallel(
      'dev:test-extension:js',
      'test:copy',
      'dev:reload'
    )
  )
)

gulp.task('dev:extension',
  gulp.series(
    'clean',
    'dev:scss',
    gulp.parallel(
      'dev:extension:js',
      'dev:copy',
      'dev:reload'
    )
  )
)

gulp.task('build',
  gulp.series(
    'clean',
    'build:scss',
    gulpParallel(
      'build:extension:js:deps:background',
      'build:extension:js:deps:ui',
      'build:extension:js',
      'copy'
    ),
    'optimize:images'
  )
)

gulp.task('build:test',
  gulp.series(
    'clean',
    'build:scss',
    gulpParallel(
      'build:extension:js:deps:background',
      'build:extension:js:deps:ui',
      'build:test:extension:js',
      'copy'
    ),
    'manifest:testing'
  )
)

gulp.task('dist',
  gulp.series(
    'build',
    'zip'
  )
)

// task generators

function zipTask (target) {
  return () => {
    return gulp.src(`dist/${target}/**`)
      .pipe(zip(`metamask-${target}-${manifest.version}.zip`))
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

  // Inject variables into bundle
  bundler.transform(envify({
    METAMASK_DEBUG: opts.devMode,
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
      bundler.on('log', gutil.log)
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
  mkdirp.sync('./sesify')
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
