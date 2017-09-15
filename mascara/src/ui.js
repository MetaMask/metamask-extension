const injectCss = require('inject-css')
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const MetaMaskUiCss = require('../../ui/css')
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
  return new Promise((resolve, reject) => {
    startPopup({ container, connectionStream }, (err, store) => {
      console.log('hello from MetaMascara ui!')
      if (err) reject(err)
      store.subscribe(() => {
        const state = store.getState()
        if (state.appState.shouldClose) window.close()
      })
      resolve()
    })
  })
}
background.on('ready', async (sw) => {
  try {
    background.removeListener('updatefound', connectApp)
    await timeout(1000)
    await connectApp(sw)
    console.log('hello from cb ready event!')
  } catch (e) {
    console.error(e)
  }
})
background.on('updatefound', windowReload)

background.startWorker()

function windowReload() {
  if (window.METAMASK_SKIP_RELOAD) return
  window.location.reload()
}

function timeout (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve()
    }, time || 1500)
  })
}