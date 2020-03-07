const { promises: fs } = require('fs')
const { merge, cloneDeep } = require('lodash')

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
      const result = merge(cloneDeep(baseManifest), platformModifications)
      const dir = `./dist/${platform}`
      await fs.mkdir(dir, { recursive: true })
      await writeJson(result, `${dir}/manifest.json`)
    }))
  })

  // dev: remove bg-libs, add chromereload, add perms
  createTask('manifest:env:dev', createTaskForModifyManifestForEnvironment((manifest) => {
    const scripts = manifest.background.scripts.filter((scriptName) => !scriptsToExcludeFromBackgroundDevBuild[scriptName])
    scripts.push('chromereload.js')
    manifest.background = {
      ...manifest.background,
      scripts,
    }
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking']
  }))

  // testDev: remove bg-libs, add perms
  createTask('manifest:env:testDev', createTaskForModifyManifestForEnvironment((manifest) => {
    const scripts = manifest.background.scripts.filter((scriptName) => !scriptsToExcludeFromBackgroundDevBuild[scriptName])
    scripts.push('chromereload.js')
    manifest.background = {
      ...manifest.background,
      scripts,
    }
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking', 'http://localhost/*']
  }))

  // test: add permissions
  createTask('manifest:env:test', createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking', 'http://localhost/*']
  }))

  // high level manifest tasks
  const dev = createTask('manifest:dev', taskSeries(
    'manifest:prod',
    'manifest:env:dev',
  ))

  const testDev = createTask('manifest:testDev', taskSeries(
    'manifest:prod',
    'manifest:env:testDev',
  ))

  const test = createTask('manifest:test', taskSeries(
    'manifest:prod',
    'manifest:env:test',
  ))

  return { prod, dev, testDev, test }

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
