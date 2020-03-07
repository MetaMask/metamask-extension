const { promises: fs } = require('fs')
const path = require('path')
const watch = require('gulp-watch')
const glob = require('fast-glob')

const { createTask, taskParallel } = require('./task')

module.exports = createStaticAssetTasks


const copyTargets = [
  {
    src: `./app/_locales/`,
    dest: `_locales`,
  },
  {
    src: `./app/images/`,
    dest: `images`,
  },
  {
    src: `./node_modules/eth-contract-metadata/images/`,
    dest: `images/contract`,
  },
  {
    src: `./app/fonts/`,
    dest: `fonts`,
  },
  {
    src: `./app/vendor/`,
    dest: `vendor`,
  },
  {
    src: `./ui/app/css/output/`,
    pattern: `*.css`,
    dest: ``,
  },
  {
    src: `./app/`,
    pattern: `*.html`,
    dest: ``,
  },
]

const copyTargetsDev = [
  ...copyTargets,
  {
    src: './app/scripts/',
    pattern: '/chromereload.js',
    dest: ``,
  },
]

function createStaticAssetTasks ({ livereload, browserPlatforms }) {

  const prod = createTask('static:prod', taskParallel(...copyTargets.map((target) => {
    return function copyStaticAssets () {
      return performCopy(target)
    }
  })))
  const dev = createTask('static:dev', taskParallel(...copyTargetsDev.map((target) => {
    return function copyStaticAssets () {
      return setupLiveCopy(target)
    }
  })))

  return { dev, prod }

  function setupLiveCopy (target) {
    const pattern = target.pattern || '/**/*'
    watch(target.src + pattern, (event) => {
      livereload.changed(event.path)
      performCopy(target)
    })
    performCopy(target)
  }

  async function performCopy (target) {
    await Promise.all(browserPlatforms.map(async (platform) => {
      if (target.pattern) {
        await copyGlob(target.src, `${target.src}${target.pattern}`, `./dist/${platform}/${target.dest}`)
      } else {
        await copyGlob(target.src, `${target.src}`, `./dist/${platform}/${target.dest}`)
      }
    }))
  }

  async function copyGlob (baseDir, srcGlob, dest) {
    const sources = await glob(srcGlob)
    await Promise.all(sources.map(async (src) => {
      const relativePath = path.relative(baseDir, src)
      await fs.copyFile(src, `${dest}${relativePath}`)
    }))
  }

}
