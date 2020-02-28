const gulp = require('gulp')
const { createTask, taskParallel, taskSeries } = require('./task')

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
    pattern: `/*.html`,
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

function createStaticAssetTasks ({ browserPlatforms }) {

  const prod = createTask('static:prod', taskParallel(...copyTargets.map(target => {
    return function copyStaticAssets () { return performCopy(target) }
  })))
  const dev = createTask('static:dev', taskParallel(...copyTargetsDev.map(target => {
    return function copyStaticAssets () { return performCopy(target) }
  })))

  return { dev, prod }

  function performCopy (target) {
    // stream from source
    const pattern = target.pattern || '/**/*'
    let stream = gulp.src(target.src + pattern, { base: target.src })
    // copy to destinations
    const destinations = browserPlatforms.map(platform => `./dist/${platform}/${target.dest}`)
    destinations.forEach(function (destination) {
      stream = stream.pipe(gulp.dest(destination))
    })
    return stream
  }

}