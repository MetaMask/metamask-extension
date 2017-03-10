const SWcontroller = require('./sw-controller')
console.log('outside:open')
const background = new SWcontroller({
  fileName: 'sw-build.js',
  registerOpts: {
    scope: './',
  }
})

background.startWorker()
.then(registerdWorker => {
  return background.sendMessage('connect')
})
.then((port) => {
  debugger
})
.catch(err => {
  console.error(`SW Controller: ${err}`)
})
