const injectCss = require('inject-css')
const startPopup = require('./responsive-core')
const MetaMaskUiCss = require('../../responsive-ui/css')
const PortStream = require('./lib/port-stream.js')
const ExtensionPlatform = require('./platforms/extension')
const extension = require('extensionizer')

// create platform global
global.platform = new ExtensionPlatform()

// inject css
const css = MetaMaskUiCss()
injectCss(css)

// setup stream to background
const extensionPort = extension.runtime.connect({ name: 'ui' })
const connectionStream = new PortStream(extensionPort)

// start ui
const container = document.getElementById('app-content')
startPopup({ container, connectionStream }, (err, store) => {
  if (err) return displayCriticalError(err)
})

function displayCriticalError (err) {
  container.innerHTML = '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>'
  container.style.height = '80px'
  log.error(err.stack)
  throw err
}
