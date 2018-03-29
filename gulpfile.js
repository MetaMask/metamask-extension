var watchify = require('watchify')
var browserify = require('browserify')
var disc = require('disc')
var gulp = require('gulp')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var gutil = require('gulp-util')
var watch = require('gulp-watch')
var sourcemaps = require('gulp-sourcemaps')
var jsoneditor = require('gulp-json-editor')
var zip = require('gulp-zip')
var assign = require('lodash.assign')
var livereload = require('gulp-livereload')
var del = require('del')
var eslint = require('gulp-eslint')
var fs = require('fs')
var path = require('path')
var manifest = require('./app/manifest.json')
var gulpif = require('gulp-if')
var replace = require('gulp-replace')
var mkdirp = require('mkdirp')
var asyncEach = require('async/each')
var exec = require('child_process').exec
var sass = require('gulp-sass')
var autoprefixer = require('gulp-autoprefixer')
var gulpStylelint = require('gulp-stylelint')
var stylefmt = require('gulp-stylefmt')
var uglify = require('gulp-uglify-es').default
var babel = require('gulp-babel')
var debug = require('gulp-debug')


var disableDebugTools = gutil.env.disableDebugTools
var debugMode = gutil.env.debug

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

gulp.task('dev:reload', function() {
  livereload.listen({
    port: 35729,
  })
})


// copy universal

gulp.task('copy:locales', copyTask({
  source: './app/_locales/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/_locales`),
}))
gulp.task('copy:images', copyTask({
  source: './app/images/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/images`),
}))
gulp.task('copy:contractImages', copyTask({
  source: './node_modules/eth-contract-metadata/images/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/images/contract`),
}))
gulp.task('copy:fonts', copyTask({
  source: './app/fonts/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/fonts`),
}))
gulp.task('copy:reload', copyTask({
  source: './app/scripts/',
  destinations: commonPlatforms.map(platform => `./dist/${platform}/scripts`),
  pattern: '/chromereload.js',
}))

// copy extension

gulp.task('copy:manifest', copyTask({
  source: './app/',
  destinations: browserPlatforms.map(platform => `./dist/${platform}`),
  pattern: '/*.json',
}))
gulp.task('copy:html', copyTask({
  source: './app/',
  destinations: browserPlatforms.map(platform => `./dist/${platform}`),
  pattern: '/*.html',
}))

// manifest tinkering

gulp.task('manifest:chrome', function() {
  return gulp.src('./dist/chrome/manifest.json')
  .pipe(jsoneditor(function(json) {
    delete json.applications
    return json
  }))
  .pipe(gulp.dest('./dist/chrome', { overwrite: true }))
})

gulp.task('manifest:opera', function() {
  return gulp.src('./dist/opera/manifest.json')
  .pipe(jsoneditor(function(json) {
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

gulp.task('manifest:production', function() {
  return gulp.src([
    './dist/firefox/manifest.json',
    './dist/chrome/manifest.json',
    './dist/edge/manifest.json',
    './dist/opera/manifest.json',
  ],{base: './dist/'})

  // Exclude chromereload script in production:
  .pipe(gulpif(!debugMode,jsoneditor(function(json) {
    json.background.scripts = json.background.scripts.filter((script) => {
      return !script.includes('chromereload')
    })
    return json
  })))

  .pipe(gulp.dest('./dist/', { overwrite: true }))
})

const copyTaskNames = [
  'copy:locales',
  'copy:images',
  'copy:fonts',
  'copy:manifest',
  'copy:html',
  'copy:contractImages',
]

if (debugMode) {
  copyTaskNames.push('copy:reload')
}

gulp.task('copy',
  gulp.series(
    gulp.parallel(...copyTaskNames),
    'manifest:production',
    'manifest:chrome',
    'manifest:opera'
  )
)
gulp.task('copy:watch', function(){
  gulp.watch(['./app/{_locales,images}/*', './app/scripts/chromereload.js', './app/*.{html,json}'], gulp.series('copy'))
})

// lint js

gulp.task('lint', function () {
  // Ignoring node_modules, dist/firefox, and docs folders:
  return gulp.src(['app/**/*.js', '!app/scripts/vendor/**/*.js', 'ui/**/*.js', 'mascara/src/*.js', 'mascara/server/*.js', '!node_modules/**', '!dist/firefox/**', '!docs/**', '!app/scripts/chromereload.js', '!mascara/test/jquery-3.1.0.min.js'])
    .pipe(eslint(fs.readFileSync(path.join(__dirname, '.eslintrc'))))
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError())
});

gulp.task('lint:fix', function () {
  return gulp.src(['app/**/*.js', 'ui/**/*.js', 'mascara/src/*.js', 'mascara/server/*.js', '!node_modules/**', '!dist/firefox/**', '!docs/**', '!app/scripts/chromereload.js', '!mascara/test/jquery-3.1.0.min.js'])
    .pipe(eslint(Object.assign(fs.readFileSync(path.join(__dirname, '.eslintrc')), {fix: true})))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
});

/*
gulp.task('default', ['lint'], function () {
    // This will only run if the lint task is successful...
});
*/

// build js

const jsFiles = [
  'inpage',
  'contentscript',
  'background',
  'ui',
]

// scss compilation and autoprefixing tasks

gulp.task('build:scss', function () {
  return gulp.src('ui/app/css/index.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(autoprefixer())
    .pipe(gulp.dest('ui/app/css/output'))
})
gulp.task('watch:scss', function() {
  gulp.watch(['ui/app/css/**/*.scss'], gulp.series(['build:scss']))
})

gulp.task('lint-scss', function() {
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

// bundle tasks
createTasksForBuildJsExtension({ jsFiles, taskPrefix: 'dev:js', bundleTaskOpts: { isBuild: false } })
createTasksForBuildJsExtension({ jsFiles, taskPrefix: 'build:js:extension', bundleTaskOpts: { isBuild: true }  })
createTasksForBuildJsMascara({ taskPrefix: 'build:js:mascara' })

function createTasksForBuildJsExtension({ jsFiles, taskPrefix, bundleTaskOpts }) {
  // inpage must be built before all other scripts:
  const rootDir = './app/scripts'
  const nonInpageFiles = jsFiles.filter(file => file !== 'inpage')
  const buildPhase1 = ['inpage']
  const buildPhase2 = nonInpageFiles
  const destinations = [
    './dist/firefox/scripts',
    './dist/chrome/scripts',
    './dist/edge/scripts',
    './dist/opera/scripts',
  ]
  createTasksForBuildJs({ rootDir, jsFiles, taskPrefix, bundleTaskOpts, destinations, buildPhase1, buildPhase2 })
}

function createTasksForBuildJsMascara({ taskPrefix, bundleTaskOpts }) {
  // inpage must be built before all other scripts:
  const rootDir = './mascara/src/'
  const jsFiles = ['ui', 'proxy', 'background']
  const destinations = ['./dist/mascara']
  createTasksForBuildJs({ rootDir, jsFiles, taskPrefix, bundleTaskOpts, destinations, buildPhase1: jsFiles })
}

function createTasksForBuildJs({ rootDir, jsFiles, taskPrefix, bundleTaskOpts, destinations, buildPhase1 = [], buildPhase2 = [] }) {
  // bundle task for each file
  jsFiles.forEach((jsFile) => {
    gulp.task(`${taskPrefix}:${jsFile}`, bundleTask(Object.assign({
      watch: false,
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

jsFiles.forEach((jsFile) => {
  gulp.task(`disc:${jsFile}`,   discTask({ label: jsFile, filename: `${jsFile}.js` }))
})

gulp.task('disc', gulp.parallel(jsFiles.map(jsFile => `disc:${jsFile}`)))

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

// set env var for production
gulp.task('apply-prod-environment', function(done) {
  process.env.NODE_ENV = 'production'
  done()
});

// high level tasks

gulp.task('dev',
  gulp.series(
    'build:scss',
    'dev:js',
    'copy',
    gulp.parallel(
      'watch:scss',
      'copy:watch',
      'dev:reload'
    )
  )
)

gulp.task('build',
  gulp.series(
    'clean',
    'build:scss',
    gulp.parallel(
      'build:js:extension',
      'build:js:mascara',
      'copy'
    )
  )
)

gulp.task('dist',
  gulp.series(
    'apply-prod-environment',
    'build',
    'zip'
  )
)

// task generators

function copyTask(opts){
  var source = opts.source
  var destination = opts.destination
  var destinations = opts.destinations || [ destination ]
  var pattern = opts.pattern || '/**/*'

  return performCopy

  function performCopy(){
    let stream = gulp.src(source + pattern, { base: source })
    destinations.forEach(function(destination) {
      stream = stream.pipe(gulp.dest(destination))
    })
    stream.pipe(gulpif(debugMode,livereload()))

    return stream
  }
}

function zipTask(target) {
  return () => {
    return gulp.src(`dist/${target}/**`)
    .pipe(zip(`metamask-${target}-${manifest.version}.zip`))
    .pipe(gulp.dest('builds'))
  }
}

function generateBundler(opts, performBundle) {
  const browserifyOpts = assign({}, watchify.args, {
    entries: [opts.filepath],
    plugin: 'browserify-derequire',
    debug: true,
    fullPaths: debugMode,
  })

  let bundler = browserify(browserifyOpts)

  if (opts.watch) {
    bundler = watchify(bundler)
    // on any file update, re-runs the bundler
    bundler.on('update', performBundle)
  }

  return bundler
}

function discTask(opts) {
  const bundler = generateBundler(opts, performBundle)
  // output build logs to terminal
  bundler.on('log', gutil.log)

  return performBundle

  function performBundle(){
    // start "disc" build
    let discDir = path.join(__dirname, 'disc')
    mkdirp.sync(discDir)
    let discPath = path.join(discDir, `${opts.label}.html`)

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

  function performBundle(){

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
      // inject variables into bundle
      .pipe(replace('\'GULP_METAMASK_DEBUG\'', debugMode))
      // buffer file contents (?)
      .pipe(buffer())
      // sourcemaps
      // loads map from browserify file
      .pipe(sourcemaps.init({ loadMaps: true }))
      // Minification
      .pipe(gulpif(opts.isBuild, uglify({
        mangle: {  reserved: [ 'MetamaskInpageProvider' ] },
      })))
      // writes .map file
      .pipe(sourcemaps.write(debugMode ? './' : '../../sourcemaps'))

    // write completed bundles
    opts.destinations.forEach((dest) => {
      buildStream = buildStream.pipe(gulp.dest(dest))
    })

    // finally, trigger live reload
    buildStream = buildStream
      .pipe(gulpif(debugMode, livereload()))

    return buildStream

  }
}

function beep () {
  process.stdout.write('\x07')
}
