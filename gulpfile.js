const watchify = require('watchify')
const browserify = require('browserify')
const envify = require('envify/custom')
const disc = require('disc')
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
const eslint = require('gulp-eslint')
const fs = require('fs')
const path = require('path')
const manifest = require('./app/manifest.json')
const replace = require('gulp-replace')
const mkdirp = require('mkdirp')
const asyncEach = require('async/each')
const exec = require('child_process').exec
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const gulpStylelint = require('gulp-stylelint')
const stylefmt = require('gulp-stylefmt')
const uglify = require('gulp-uglify-es').default
const babel = require('gulp-babel')
const debug = require('gulp-debug')
const pify = require('pify')
const gulpMultiProcess = require('gulp-multi-process')
const endOfStream = pify(require('end-of-stream'))

function gulpParallel(...args) {
  return function spawnGulpChildProcess(cb) {
    return gulpMultiProcess(args, cb, true)
  }
}

const browserPlatforms = [
  'firefox',
  'chrome',
  'edge',
  'opera',
]
const commonPlatforms = [
  // browser webapp
  'mascara',
  // browser extensions
  ...browserPlatforms
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

// copy mascara

createCopyTasks('html:mascara', {
  source: './mascara/',
  pattern: 'proxy/index.html',
  destinations: [`./dist/mascara/`],
})

function createCopyTasks(label, opts) {
  if (!opts.devOnly) {
    const copyTaskName = `copy:${label}`
    copyTask(copyTaskName, opts)
    copyTaskNames.push(copyTaskName)
  }
  const copyDevTaskName = `dev:copy:${label}`
  copyTask(copyDevTaskName, Object.assign({ devMode: true }, opts))
  copyDevTaskNames.push(copyDevTaskName)
}

function copyTask(taskName, opts) {
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

  function performCopy() {
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
      return json
    }))
    .pipe(gulp.dest('./dist/chrome', { overwrite: true }))
})

gulp.task('manifest:opera', function () {
  return gulp.src('./dist/opera/manifest.json')
    .pipe(jsoneditor(function (json) {
      json.permissions = [
        "storage",
        "tabs",
        "clipboardWrite",
        "clipboardRead",
        "http://localhost:8545/"
      ]
      return json
    }))
    .pipe(gulp.dest('./dist/opera', { overwrite: true }))
})

gulp.task('manifest:production', function () {
  return gulp.src([
    './dist/firefox/manifest.json',
    './dist/chrome/manifest.json',
    './dist/edge/manifest.json',
    './dist/opera/manifest.json',
  ], { base: './dist/' })

    // Exclude chromereload script in production:
    .pipe(jsoneditor(function (json) {
      json.background.scripts = json.background.scripts.filter((script) => {
        return !script.includes('chromereload')
      })
      return json
    }))

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
    'manifest:chrome',
    'manifest:opera'
  )
)

// lint js

const lintTargets = ['app/**/*.json', 'app/**/*.js', '!app/scripts/vendor/**/*.js', 'ui/**/*.js', 'old-ui/**/*.js', 'mascara/src/*.js', 'mascara/server/*.js', '!node_modules/**', '!dist/firefox/**', '!docs/**', '!app/scripts/chromereload.js', '!mascara/test/jquery-3.1.0.min.js']

gulp.task('lint', function () {
  // Ignoring node_modules, dist/firefox, and docs folders:
  return gulp.src(lintTargets)
    .pipe(eslint(fs.readFileSync(path.join(__dirname, '.eslintrc'))))
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError())
});

gulp.task('lint:fix', function () {
  return gulp.src(lintTargets)
    .pipe(eslint(Object.assign(fs.readFileSync(path.join(__dirname, '.eslintrc')), { fix: true })))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
});

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
  pattern: 'ui/app/css/**/*.scss',
}))

function createScssBuildTask({ src, dest, devMode, pattern }) {
  return function () {
    if (devMode) {
      watch(pattern, async (event) => {
        const stream = buildScss()
        await endOfStream(stream)
        livereload.changed(event.path)
      })
    }
    return buildScss()
  }

  function buildScss() {
    return gulp.src(src)
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(sourcemaps.write())
      .pipe(autoprefixer())
      .pipe(gulp.dest(dest))
  }
}

gulp.task('lint-scss', function () {
  return gulp
    .src('ui/app/css/itcss/**/*.scss')
    .pipe(gulpStylelint({
      reporters: [
        { formatter: 'string', console: true }
      ],
      fix: true,
    }));
});

gulp.task('fmt-scss', function () {
  return gulp.src('ui/app/css/itcss/**/*.scss')
    .pipe(stylefmt())
    .pipe(gulp.dest('ui/app/css/itcss'));
});

// build js

const buildJsFiles = [
  'inpage',
  'contentscript',
  'background',
  'ui',
]

// bundle tasks
createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'dev:extension:js', devMode: true })
createTasksForBuildJsExtension({ buildJsFiles, taskPrefix: 'build:extension:js' })
createTasksForBuildJsMascara({ taskPrefix: 'build:mascara:js' })
createTasksForBuildJsMascara({ taskPrefix: 'dev:mascara:js', devMode: true })

function createTasksForBuildJsExtension({ buildJsFiles, taskPrefix, devMode, bundleTaskOpts = {} }) {
  // inpage must be built before all other scripts:
  const rootDir = './app/scripts'
  const nonInpageFiles = buildJsFiles.filter(file => file !== 'inpage')
  const buildPhase1 = ['inpage']
  const buildPhase2 = nonInpageFiles
  const destinations = browserPlatforms.map(platform => `./dist/${platform}`)
  bundleTaskOpts = Object.assign({
    buildSourceMaps: true,
    sourceMapDir: devMode ? './' : '../sourcemaps',
    minifyBuild: !devMode,
    buildWithFullPaths: devMode,
    watch: devMode,
    devMode,
  }, bundleTaskOpts)
  createTasksForBuildJs({ rootDir, taskPrefix, bundleTaskOpts, destinations, buildPhase1, buildPhase2 })
}

function createTasksForBuildJsMascara({ taskPrefix, devMode, bundleTaskOpts = {} }) {
  // inpage must be built before all other scripts:
  const rootDir = './mascara/src/'
  const buildPhase1 = ['ui', 'proxy', 'background', 'metamascara']
  const destinations = ['./dist/mascara']
  bundleTaskOpts = Object.assign({
    buildSourceMaps: true,
    sourceMapDir: './',
    minifyBuild: !devMode,
    buildWithFullPaths: devMode,
    watch: devMode,
    devMode,
  }, bundleTaskOpts)
  createTasksForBuildJs({ rootDir, taskPrefix, bundleTaskOpts, destinations, buildPhase1 })
}

function createTasksForBuildJs({ rootDir, taskPrefix, bundleTaskOpts, destinations, buildPhase1 = [], buildPhase2 = [] }) {
  // bundle task for each file
  const jsFiles = [].concat(buildPhase1, buildPhase2)
  jsFiles.forEach((jsFile) => {
    gulp.task(`${taskPrefix}:${jsFile}`, bundleTask(Object.assign({
      label: jsFile,
      filename: `${jsFile}.js`,
      filepath: `${rootDir}/${jsFile}.js`,
      destinations,
    }, bundleTaskOpts)))
  })
  // compose into larger task
  const subtasks = []
  subtasks.push(gulp.parallel(buildPhase1.map(file => `${taskPrefix}:${file}`)))
  if (buildPhase2.length) subtasks.push(gulp.parallel(buildPhase2.map(file => `${taskPrefix}:${file}`)))

  gulp.task(taskPrefix, gulp.series(subtasks))
}

// disc bundle analyzer tasks

buildJsFiles.forEach((jsFile) => {
  gulp.task(`disc:${jsFile}`, discTask({ label: jsFile, filename: `${jsFile}.js` }))
})

gulp.task('disc', gulp.parallel(buildJsFiles.map(jsFile => `disc:${jsFile}`)))

// clean dist

gulp.task('clean', function clean() {
  return del(['./dist/*'])
})

// zip tasks for distribution
gulp.task('zip:chrome', zipTask('chrome'))
gulp.task('zip:firefox', zipTask('firefox'))
gulp.task('zip:edge', zipTask('edge'))
gulp.task('zip:opera', zipTask('opera'))
gulp.task('zip', gulp.parallel('zip:chrome', 'zip:firefox', 'zip:edge', 'zip:opera'))

// high level tasks

gulp.task('dev',
  gulp.series(
    'clean',
    'dev:scss',
    gulp.parallel(
      'dev:extension:js',
      'dev:mascara:js',
      'dev:copy',
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

gulp.task('dev:mascara',
  gulp.series(
    'clean',
    'dev:scss',
    gulp.parallel(
      'dev:mascara:js',
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
      'build:extension:js',
      'build:mascara:js',
      'copy'
    )
  )
)

gulp.task('build:extension',
  gulp.series(
    'clean',
    'build:scss',
    gulp.parallel(
      'build:extension:js',
      'copy'
    )
  )
)

gulp.task('build:mascara',
  gulp.series(
    'clean',
    'build:scss',
    gulp.parallel(
      'build:mascara:js',
      'copy'
    )
  )
)

gulp.task('dist',
  gulp.series(
    'build',
    'zip'
  )
)

// task generators

function zipTask(target) {
  return () => {
    return gulp.src(`dist/${target}/**`)
      .pipe(zip(`akroma-${target}-${manifest.version}.zip`))
      .pipe(gulp.dest('builds'))
  }
}

function generateBundler(opts, performBundle) {
  const browserifyOpts = assign({}, watchify.args, {
    entries: [opts.filepath],
    plugin: 'browserify-derequire',
    debug: opts.buildSourceMaps,
    fullPaths: opts.buildWithFullPaths,
  })

  let bundler = browserify(browserifyOpts)

  // inject variables into bundle
  bundler.transform(envify({
    METAMASK_DEBUG: opts.devMode,
    NODE_ENV: opts.devMode ? 'development' : 'production',
  }))

  // Minification
  if (opts.minifyBuild) {
    bundler.transform('uglifyify', {
      global: true,
      mangle: {
        reserved: ['MetamaskInpageProvider']
      },
    })
  }

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

function discTask(opts) {
  opts = Object.assign({
    buildWithFullPaths: true,
  }, opts)

  const bundler = generateBundler(opts, performBundle)
  // output build logs to terminal
  bundler.on('log', gutil.log)

  return performBundle

  function performBundle() {
    // start "disc" build
    const discDir = path.join(__dirname, 'disc')
    mkdirp.sync(discDir)
    const discPath = path.join(discDir, `${opts.label}.html`)

    return (
      bundler.bundle()
        .pipe(disc())
        .pipe(fs.createWriteStream(discPath))
    )
  }
}


function bundleTask(opts) {
  const bundler = generateBundler(opts, performBundle)
  // output build logs to terminal
  bundler.on('log', gutil.log)

  return performBundle

  function performBundle() {
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

    // Finalize Source Maps (writes .map file)
    if (opts.buildSourceMaps) {
      buildStream = buildStream
        .pipe(sourcemaps.write(opts.sourceMapDir))
    }

    // write completed bundles
    opts.destinations.forEach((dest) => {
      buildStream = buildStream.pipe(gulp.dest(dest))
    })

    return buildStream

  }
}

function beep() {
  process.stdout.write('\x07')
}
