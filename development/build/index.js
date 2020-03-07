const gulp = require('gulp')
const gulpZip = require('gulp-zip')
const livereload = require('gulp-livereload')
const del = require('del')
const { promises: fs } = require('fs')
const pify = require('pify')
const pump = pify(require('pump'))
const baseManifest = require('../../app/manifest/_base.json')
const { createTask, composeSeries, composeParallel, runTask } = require('./task')
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
// etc tasks
//

const clean = createTask('clean', async function clean () {
  await del(['./dist/*'])
  await Promise.all(browserPlatforms.map(async (platform) => {
    await fs.mkdir(`./dist/${platform}`, { recursive: true })
  }))
})

const reload = createTask('reload', async function devReload () {
  livereload.listen({ port: 35729 })
})

function createZipTask (target) {
  return async () => {
    await pump(
      gulp.src(`dist/${target}/**`),
      gulpZip(`metamask-${target}-${baseManifest.version}.zip`),
      gulp.dest('builds'),
    )
  }
}

//
// primary tasks
//

const staticTasks = createStaticAssetTasks({ livereload, browserPlatforms })
const manifestTasks = createManifestTasks({ browserPlatforms })
const styleTasks = createStyleTasks({ livereload })
const scriptTasks = createScriptTasks({ livereload, browserPlatforms })

// zip tasks for distribution
const zip = createTask('zip', composeParallel(
  createZipTask('chrome'),
  createZipTask('firefox'),
  createZipTask('opera'),
))

// top-level tasks

createTask('styles', styleTasks.prod)

createTask('dev',
  composeSeries(
    clean,
    styleTasks.dev,
    composeParallel(
      scriptTasks.dev,
      staticTasks.dev,
      manifestTasks.dev,
      reload
    )
  )
)

createTask('testDev',
  composeSeries(
    clean,
    styleTasks.dev,
    composeParallel(
      scriptTasks.testDev,
      staticTasks.dev,
      manifestTasks.testDev,
      reload
    )
  )
)

createTask('prod',
  composeSeries(
    clean,
    styleTasks.prod,
    composeParallel(
      scriptTasks.prod,
      staticTasks.prod,
      manifestTasks.prod,
    ),
    zip,
  )
)

createTask('test',
  composeSeries(
    clean,
    styleTasks.prod,
    composeParallel(
      scriptTasks.test,
      staticTasks.prod,
      manifestTasks.test,
    ),
  )
)

// get requested task name and execute
const taskName = process.argv[2]
if (!taskName) {
  throw new Error(`MetaMask build: No task name specified`)
}
const skipStats = process.argv[3] === '--skip-stats'

runTask(taskName, { skipStats })
