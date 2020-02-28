const gulp = require('gulp')
const gulpZip = require('gulp-zip')
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


const staticTasks = createStaticAssetTasks({ browserPlatforms })
const manifestTasks = createManifestTasks({ browserPlatforms })
const styleTasks = createStyleTasks()
const scriptTasks = createScriptTasks({ browserPlatforms })

// createTask('optimize:images', function () {
//   return gulp.src('./dist/**/images/**', { base: './dist/' })
//     .pipe(imagemin())
//     .pipe(gulp.dest('./dist/', { overwrite: true }))
// })


// zip tasks for distribution
const zip = createTask('zip', taskParallel(
  zipTask('chrome'),
  zipTask('firefox'),
  zipTask('opera'),
))

// high level tasks

const dev = createTask('dev',
  taskSeries(
    clean,
    styleTasks.dev,
    taskParallel(
      scriptTasks.dev,
      staticTasks.dev,
      manifestTasks.dev,
      'reload'
    )
  )
)

const testDev = createTask('testDev',
  taskSeries(
    clean,
    styleTasks.dev,
    taskParallel(
      scriptTasks.testDev,
      staticTasks.dev,
      manifestTasks.testing,
      'reload',
    )
  )
)

const prod = createTask('prod',
  taskSeries(
    clean,
    styleTasks.prod,
    taskParallel(
      scriptTasks.prod,
      staticTasks.prod,
      manifestTasks.prod,
    ),
    // 'optimize:images',
    zip,
  )
)

const test = createTask('test',
  taskSeries(
    clean,
    styleTasks.prod,
    taskParallel(
      scriptTasks.test,
      staticTasks.prod,
      manifestTasks.testing,
    ),
  )
)

// task generators

function zipTask (target) {
  return () => {
    return gulp.src(`dist/${target}/**`)
      .pipe(gulpZip(`metamask-${target}-${baseManifest.version}.zip`))
      .pipe(gulp.dest('builds'))
  }
}

runTask('prod')