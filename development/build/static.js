const gulp = require('gulp')
const watch = require('gulp-watch')
// const endOfStream = require('pify')(require('end-of-stream'))
const pify = require('pify')
const { exec } = pify(require('child_process'))

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
    await Promise.all(browserPlatforms.map(async platform => {
      if (target.pattern) {
        await exec(`cp ${target.src}${target.pattern} ./dist/${platform}/${target.dest}`)
      } else {
        await exec(`cp -r ${target.src} ./dist/${platform}/${target.dest}`)
      }
    }))
  }

}
