const pump = require('pump')
const injectCss = require('inject-css')
const ObjectMultiplex = require('obj-multiplex')
const LocalStorageStore = require('obs-store')
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const startUi = require('./app/widget/default.js')
const widgetCss = require('./css')

injectCss(widgetCss())

const container = document.getElementById('container')
var name = 'widget'
window.METAMASK_UI_TYPE = name

const intervalDelay = Math.floor(Math.random() * (30000 - 1000)) + 1000
const background = new SWcontroller({
  fileName: '/background.js',
})
// Setup listener for when the service worker is read

background.on('ready', async (sw) => {
  try {
    const connectionStream = SwStream({
      serviceWorker: background.controller,
      context: 'publicConfig',
    })
    const publicConfigStore = createPublicConfigStore(connectionStream)

    startUi(container, publicConfigStore)

  } catch (e) {
    console.error(e)
  }
})

background.startWorker()

function createPublicConfigStore (connectionStream) {
  const mux = new ObjectMultiplex()
  pump(
    connectionStream,
    mux,
    connectionStream,
    (err) => logStreamDisconnectWarning('MetaMask', err)
  )

  // subscribe to metamask public config (one-way)
  const publicConfigStore = new LocalStorageStore({ storageKey: 'MetaMask-Config' })
  pump(
    mux.createStream('publicConfig'),
    publicConfigStore,
    (err) => logStreamDisconnectWarning('MetaMask PublicConfigStore', err)
  )
  return publicConfigStore
}