const gulp = require('gulp')
const gulpZip = require('gulp-zip')
const livereload = require('gulp-livereload')
const del = require('del')
const { promises: fs } = require('fs').promises
const baseManifest = require('../../app/manifest/_base.json')

const { createTask, taskSeries, taskParallel, runTask } = require('./task')

const createManifestTasks = require('./manifest')
const createScriptTasks = require('./scripts')
const createStyleTasks = require('./styles')
const createStaticAssetTasks = require('./static')

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
  await Promise.all(browserPlatforms.map(async (platform) => {
    await fs.mkdir(`./dist/${platform}`, { recursive: true })
  }))
}

// browser reload

createTask('reload', function devReload () {
  livereload.listen({ port: 35729 })
})

// primary tasks

const staticTasks = createStaticAssetTasks({ livereload, browserPlatforms })
const manifestTasks = createManifestTasks({ browserPlatforms })
const styleTasks = createStyleTasks({ livereload })
const scriptTasks = createScriptTasks({ livereload, browserPlatforms })

// zip tasks for distribution
const zip = createTask('zip', taskParallel(
  zipTask('chrome'),
  zipTask('firefox'),
  zipTask('opera'),
))

// top-level tasks

createTask('styles', styleTasks.prod)

createTask('dev',
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

createTask('testDev',
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

createTask('prod',
  taskSeries(
    clean,
    styleTasks.prod,
    taskParallel(
      scriptTasks.prod,
      staticTasks.prod,
      manifestTasks.prod,
    ),
    zip,
  )
)

createTask('test',
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

// get task name and execute
const taskName = process.argv[2]
if (!taskName) {
  throw new Error(`MetaMask build: No task name specified`)
}
const skipStats = process.argv[3] === '--skip-stats'

runTask(taskName, { skipStats })
