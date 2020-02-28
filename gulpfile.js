const gulp = require('gulp')
const zip = require('gulp-zip')
const livereload = require('gulp-livereload')
const del = require('del')
// const imagemin = require('gulp-imagemin')
const baseManifest = require('./app/manifest/_base.json')
const { createTask, taskEvents, taskSeries, taskParallel, runTask } = require('./development/build/task')
const { setupTaskDisplay } = require('./development/build/display')

const createManifestTasks = require('./development/build/manifest')
const createScriptTasks = require('./development/build/scripts')
const createStyleTasks = require('./development/build/styles')
const createStaticAssetTasks = require('./development/build/static')

setupTaskDisplay(taskEvents)


const browserPlatforms = [
  'firefox',
  'chrome',
  'brave',
  'opera',
]

//
// tasks
//

async function clean () {
  await del(['./dist/*'])
}

// browser reload

createTask('reload', function devReload () {
  livereload.listen({ port: 35729 })
})


createStaticAssetTasks({ browserPlatforms })
createManifestTasks({ browserPlatforms })
createStyleTasks()

// scripts
createScriptTasks({ browserPlatforms })

// createTask('optimize:images', function () {
//   return gulp.src('./dist/**/images/**', { base: './dist/' })
//     .pipe(imagemin())
//     .pipe(gulp.dest('./dist/', { overwrite: true }))
// })


// zip tasks for distribution
createTask('zip', taskParallel(
  zipTask('chrome'),
  zipTask('firefox'),
  zipTask('opera'),
))

// high level tasks

createTask('dev:test',
  taskSeries(
    clean,
    'styles:dev',
    taskParallel(
      'scripts:core:test-live',
      'static:dev',
      'manifest:testing',
      'reload',
    )
  )
)

createTask('dev:extension',
  taskSeries(
    clean,
    'styles:dev',
    taskParallel(
      'scripts:core:dev',
      'static:dev',
      'manifest:dev',
      'reload'
    )
  )
)

createTask('build',
  taskSeries(
    clean,
    'styles:prod',
    taskParallel(
      'scripts:deps:background',
      'scripts:deps:ui',
      'scripts:core:prod',
      'static:prod',
      'manifest:prod',
    ),
    // 'optimize:images'
  )
)

createTask('build:test',
  taskSeries(
    clean,
    'styles:prod',
    taskParallel(
      'scripts:deps:background',
      'scripts:deps:ui',
      'scripts:core:test',
      'static:prod',
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

runTask('dist')