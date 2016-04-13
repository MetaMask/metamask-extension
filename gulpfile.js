var watchify = require('watchify')
var browserify = require('browserify')
var gulp = require('gulp')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var gutil = require('gulp-util')
var watch = require('gulp-watch')
var sourcemaps = require('gulp-sourcemaps')
var assign = require('lodash.assign')
var livereload = require('gulp-livereload')
var del = require('del')

// browser reload

gulp.task('dev:reload', function() {
  livereload.listen({
    port: 35729,
    // basePath: './dist/'
  })
})


// copy static

gulp.task('copy:locales', copyTask({
  source: './app/_locales/',
  destination: './dist/_locales',
}))
gulp.task('copy:images', copyTask({
  source: './app/images/',
  destination: './dist/images',
}))
gulp.task('copy:reload', copyTask({
  source: './app/scripts/',
  destination: './dist/scripts',
  pattern: '/chromereload.js',
}))
gulp.task('copy:root', copyTask({
  source: './app/',
  destination: './dist',
  pattern: '/*',
}))
gulp.task('copy',  gulp.parallel('copy:locales','copy:images','copy:reload','copy:root'))
gulp.task('copy:watch', function(){
  gulp.watch(['./app/{_locales,images}/', './app/scripts/chromereload.js', './app/*.{html,json}'], gulp.series('copy'))
})


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

// clean dist


gulp.task('clean', function clean() {
  return del(['./dist'])
})


// high level tasks

gulp.task('dev', gulp.series('dev:js', 'copy', gulp.parallel('copy:watch', 'dev:reload')))
gulp.task('build', gulp.series('clean', gulp.parallel('build:js', 'copy')))

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
      // optional, remove if you don't need to buffer file contents
      .pipe(buffer())
      // optional, remove if you dont want sourcemaps
      .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      // Add transformation tasks to the pipeline here.
      .pipe(sourcemaps.write('./')) // writes .map file
      .pipe(gulp.dest('./dist/scripts'))
      .pipe(livereload())

    )
  }
}
