var watchify = require('watchify')
var browserify = require('browserify')
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
var brfs = require('gulp-brfs')
var del = require('del')
var eslint = require('gulp-eslint')
var fs = require('fs')
var path = require('path')

// browser reload

gulp.task('dev:reload', function() {
  livereload.listen({
    port: 35729,
    // basePath: './dist/firefox/'
  })
})


// copy static

gulp.task('copy:locales', copyTask({
  source: './app/_locales/',
  destination: './dist/firefox/_locales',
}))
gulp.task('copy:images', copyTask({
  source: './app/images/',
  destination: './dist/firefox/images',
}))
gulp.task('copy:fonts', copyTask({
  source: './app/fonts/',
  destination: './dist/firefox/fonts',
}))
gulp.task('copy:reload', copyTask({
  source: './app/scripts/',
  destination: './dist/firefox/scripts',
  pattern: '/chromereload.js',
}))
gulp.task('copy:root', copyTask({
  source: './app/',
  destination: './dist/firefox',
  pattern: '/*',
}))
gulp.task('manifest:cleanup', function() {
  return gulp.src('./dist/firefox/manifest.json')
  .pipe(jsoneditor(function(json) {
    delete json.applications
    return json
  }))
  .pipe(gulp.dest('./dist/chrome', { overwrite: false }))
})
gulp.task('copy:chrome', gulp.series(
copyTask({
  source: './dist/firefox',
  destination: './dist/chrome',
  pattern: '**/[^manifest]*'
}), 'manifest:cleanup'))
gulp.task('copy',  gulp.series(gulp.parallel('copy:locales','copy:images','copy:fonts','copy:reload','copy:root'), 'copy:chrome'))
gulp.task('copy:watch', function(){
  gulp.watch(['./app/{_locales,images}/*', './app/scripts/chromereload.js', './app/*.{html,json}'], gulp.series('copy'))
})

// lint js

gulp.task('lint', function () {
  // Ignoring node_modules, dist/firefox, and docs folders:
  return gulp.src(['app/**/*.js', 'ui/**/*.js', '!node_modules/**', '!dist/firefox/**', '!docs/**', '!app/scripts/chromereload.js'])
    .pipe(eslint(fs.readFileSync(path.join(__dirname, '.eslintrc'))))
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError())
});

/*
gulp.task('default', ['lint'], function () {
    // This will only run if the lint task is successful...
});
*/

// build js

gulp.task('dev:js:inpage', bundleTask({ watch: true, filename: 'inpage.js' }))
gulp.task('dev:js:contentscript', bundleTask({ watch: true, filename: 'contentscript.js' }))
gulp.task('dev:js:background', bundleTask({ watch: true, filename: 'background.js' }))
gulp.task('dev:js:popup', bundleTask({ watch: true, filename: 'popup.js' }))
gulp.task('dev:js',  gulp.parallel('dev:js:inpage','dev:js:contentscript','dev:js:background','dev:js:popup'))

gulp.task('build:js:inpage', bundleTask({ watch: false, filename: 'inpage.js' }))
gulp.task('build:js:contentscript', bundleTask({ watch: false, filename: 'contentscript.js' }))
gulp.task('build:js:background', bundleTask({ watch: false, filename: 'background.js' }))
gulp.task('build:js:popup', bundleTask({ watch: false, filename: 'popup.js' }))
gulp.task('build:js',  gulp.parallel('build:js:inpage','build:js:contentscript','build:js:background','build:js:popup'))

// clean dist/firefox


gulp.task('clean', function clean() {
  return del(['./dist/*'])
})

// zip tasks for distribution
gulp.task('zip:chrome', () => {
  return gulp.src('dist/chrome/**')
  .pipe(zip('chrome.zip'))
  .pipe(gulp.dest('dist'));
});
gulp.task('zip:firefox', () => {
  return gulp.src('dist/firefox/**')
  .pipe(zip('firefox.zip'))
  .pipe(gulp.dest('dist'));
});
gulp.task('zip', gulp.parallel('zip:chrome', 'zip:firefox'))

// high level tasks

gulp.task('dev', gulp.series('dev:js', 'copy', gulp.parallel('copy:watch', 'dev:reload')))
gulp.task('build', gulp.series('clean', gulp.parallel('build:js', 'copy')))
gulp.task('dist', gulp.series('build', 'zip:firefox'))

// task generators

function copyTask(opts){
  var source = opts.source
  var destination = opts.destination
  var pattern = opts.pattern || '/**/*'

  return performCopy

  function performCopy(){
    return (

      gulp.src(source + pattern, { base: source })
      .pipe(gulp.dest(destination))
      .pipe(livereload())

    )
  }
}

function bundleTask(opts) {
  var browserifyOpts = assign({}, watchify.args, {
    entries: ['./app/scripts/'+opts.filename],
    debug: true,
    plugin: 'browserify-derequire',
  })

  var bundler = browserify(browserifyOpts)
  bundler.transform('brfs')
  if (opts.watch) {
    bundler = watchify(bundler)
    bundler.on('update', performBundle) // on any dep update, runs the bundler
  }

  bundler.on('log', gutil.log) // output build logs to terminal

  return performBundle

  function performBundle(){
    return (

      bundler.bundle()
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source(opts.filename))
      .pipe(brfs())
      // optional, remove if you don't need to buffer file contents
      .pipe(buffer())
      // optional, remove if you dont want sourcemaps
      .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      // Add transformation tasks to the pipeline here.
      .pipe(sourcemaps.write('./')) // writes .map file
      .pipe(gulp.dest('./dist/firefox/scripts'))
      .pipe(livereload())

    )
  }
}
