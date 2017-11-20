const pump = require('pump')
const injectCss = require('inject-css')
const ObjectMultiplex = require('obj-multiplex')
const LocalStorageStore = require('obs-store')
const StreamProvider = require('web3-stream-provider')
const EthQuery = require('ethjs-query')
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const MetaMaskUiCss = require('../../ui/css')
const startPopup = require('../../app/scripts/popup-core')

var css = MetaMaskUiCss()
injectCss(css)
const container = document.getElementById('app-content')

var name = 'widget'
window.METAMASK_UI_TYPE = name

const intervalDelay = Math.floor(Math.random() * (30000 - 1000)) + 1000

const background = new SWcontroller({
  fileName: '/background.js',
  letBeIdle: false,
  intervalDelay,
  wakeUpInterval: 20000,
})
// Setup listener for when the service worker is read

background.on('ready', async (sw) => {
  try {
    const connectionStream = SwStream({
      serviceWorker: background.controller,
      context: 'publicConfig',
    })
    const publicConfigStore = createPublicConfigStore(connectionStream)

  } catch(e) { console.error(e) }
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