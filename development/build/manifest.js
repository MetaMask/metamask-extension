const { promises: fs } = require('fs')
const clone = require('clone')
const mergeDeep = require('merge-deep')
const baseManifest = require('../../app/manifest/_base.json')

const { createTask, taskSeries } = require('./task')

module.exports = createManifestTasks


const scriptsToExcludeFromBackgroundDevBuild = {
  'bg-libs.js': true,
}

function createManifestTasks ({ browserPlatforms }) {

  const prod = createTask('manifest:prod', async () => {
    return Promise.all(browserPlatforms.map(async (platform) => {
      const platformModifications = await readJson(`${__dirname}/../../app/manifest/${platform}.json`)
      const result = mergeDeep(clone(baseManifest), platformModifications)
      const dir = `./dist/${platform}`
      await fs.mkdir(dir, { recursive: true })
      await writeJson(result, `${dir}/manifest.json`)
    }))
  })

  // dev: remove bg-libs, add chromereload, add perms
  createTask('manifest:env:dev', createTaskForModifyManifestForEnvironment(function (manifest) {
    const scripts = manifest.background.scripts.filter((scriptName) => !scriptsToExcludeFromBackgroundDevBuild[scriptName])
    scripts.push('chromereload.js')
    manifest.background = {
      ...manifest.background,
      scripts,
    }
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking']
  }))

  // testing-local: remove bg-libs, add perms
  createTask('manifest:env:testing-local', createTaskForModifyManifestForEnvironment(function (manifest) {
    const scripts = manifest.background.scripts.filter((scriptName) => !scriptsToExcludeFromBackgroundDevBuild[scriptName])
    scripts.push('chromereload.js')
    manifest.background = {
      ...manifest.background,
      scripts,
    }
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking', 'http://localhost/*']
  }))

  // testing: add permissions
  createTask('manifest:env:testing', createTaskForModifyManifestForEnvironment(function (manifest) {
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking', 'http://localhost/*']
  }))

  // high level manifest tasks
  const dev = createTask('manifest:dev', taskSeries(
    'manifest:prod',
    'manifest:env:dev',
  ))

  const testingLocal = createTask('manifest:testing-local', taskSeries(
    'manifest:prod',
    'manifest:env:testing-local',
  ))

  const testing = createTask('manifest:testing', taskSeries(
    'manifest:prod',
    'manifest:env:testing',
  ))

  return { prod, dev, testingLocal, testing }

  // helper for modifying each platform's manifest.json in place
  function createTaskForModifyManifestForEnvironment (transformFn) {
    return () => {
      return Promise.all(browserPlatforms.map(async (platform) => {
        const path = `./dist/${platform}/manifest.json`
        const manifest = await readJson(path)
        transformFn(manifest)
        await writeJson(manifest, path)
      }))
    }
  }

}

// helper for reading and deserializing json from fs
async function readJson (path) {
  return JSON.parse(await fs.readFile(path, 'utf8'))
}

// helper for serializing and writing json to fs
async function writeJson (obj, path) {
  return fs.writeFile(path, JSON.stringify(obj, null, 2))
}
