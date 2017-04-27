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

let intervalDelay =  Math.floor(Math.random() * (30000 - 1000)) + 1000

const background = new SWcontroller({
  fileName: '/background.js',
  letBeIdle: false,
  intervalDelay,
  wakeUpInterval: 20000
})
// Setup listener for when the service worker is read
const connectApp = function (readSw) {
  let connectionStream = SwStream({
    serviceWorker: background.controller,
    context: name,
  })
  startPopup({container, connectionStream}, (err, store) => {
    if (err) return displayCriticalError(err)
    store.subscribe(() => {
      const state = store.getState()
      if (state.appState.shouldClose) window.close()
      console.log('IN the things?')
    })
  })
}

background.on('ready', (sw) => {
  background.removeListener('updatefound', connectApp)
  connectApp(sw)
})
background.on('updatefound', () => background.serviceWorkerApi.ready
  .then((sw) =>{
    background.removeListener('ready', connectApp)
    connectApp(sw.active)
  })
)
background.on('message', (messageEvent) => {
  console.log(messageEvent)
})
window.addEventListener('load', () => background.startWorker())
// background.startWorker()
console.log('hello from MetaMascara ui!')
