const injectCss = require('inject-css')
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const MetaMaskUiCss = require('../../ui/css')
const setupIframe = require('./lib/setup-iframe.js')
const MetamaskInpageProvider = require('../../app/scripts/lib/inpage-provider.js')
const MetamascaraPlatform = require('../../app/scripts/platforms/window')
const startPopup = require('../../app/scripts/popup-core')

// create platform global
global.platform = new MetamascaraPlatform()


var css = MetaMaskUiCss()
injectCss(css)
const container = document.getElementById('app-content')

var name = 'popup'
window.METAMASK_UI_TYPE = name

const background = new SWcontroller({
  fileName: '/popup/sw-build.js',
})

// Setup listener for when the service worker is read
background.on('ready', (readSw) => {
  let connectionStream = SwStream({
    serviceWorker: background.controller,
    context: name,
  })
  startPopup({container, connectionStream}, (err, store) => {
    if (err) return displayCriticalError(err)
    store.subscribe(() => {
      const state = store.getState()
      if (state.appState.shouldClose) window.close()
    })
  })
})

background.startWorker()
console.log('hello from /library/popup.js')
