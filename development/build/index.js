const gulp = require('gulp')
const gulpZip = require('gulp-zip')
const livereload = require('gulp-livereload')
const del = require('del')
// const imagemin = require('gulp-imagemin')
const baseManifest = require('../../app/manifest/_base.json')

const { createTask, taskEvents, taskSeries, taskParallel, runTask } = require('./task')
const { setupTaskDisplay } = require('./display')

const createManifestTasks = require('./manifest')
const createScriptTasks = require('./scripts')
const createStyleTasks = require('./styles')
const createStaticAssetTasks = require('./static')

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

// entry tasks

const styles = styleTasks.prod

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

// runTask('prod')

const entryTasks = {
  dev, testDev, test, prod, styles
}


// get task name and execute
const taskName = process.argv[2]
if (!taskName) {
  throw new Error(`MetaMask build: No task name specified`)
}
if (!(taskName in entryTasks)) {
  throw new Error(`MetaMask build: Unrecognized task name "${taskName}"`)
}
console.log(`running task "${taskName}"...`)
entryTasks[taskName]()