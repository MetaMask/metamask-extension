const Helper = require('./util/mascara-test-helper.js')
debugger
window.addEventListener('load', () => {
  const helper = new Helper()
  helper.on('complete', () => require('../src/ui.js'))
  helper.tryToCleanContext()
})
