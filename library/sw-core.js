global.window = global
const asyncQ = require('async-q')
const pipe = require('pump')

const SwGlobalListener = require('sw-stream/lib/sw-global-listener.js')
const connectionListener = new SwGlobalListener(self)
const setupMultiplex = require('../app/scripts/lib/stream-utils.js').setupMultiplex
const PortStream = require('../app/scripts/lib/port-stream.js')
// const notification = require('../app/scripts/lib/notifications.js')

const DbController = require('./controllers/index-db-controller')

const MetamaskController = require('../app/scripts/metamask-controller')
const extension = {} //require('../app/scripts/lib/extension')
// const LocalStorageStore = require('obs-store/lib/localStorage')
const storeTransform = require('obs-store/lib/transform')
const Migrator = require('../app/scripts/lib/migrator/')
const migrations = require('../app/scripts/migrations/')
const firstTimeState = require('../app/scripts/first-time-state')

const STORAGE_KEY = 'metamask-config'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
let popupIsOpen = false

const log = require('loglevel')
global.log = log
log.setDefaultLevel(METAMASK_DEBUG ? 'debug' : 'warn')

self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim())
})

console.log('inside:open')


// // state persistence
let diskStore
const dbController = new DbController({
  key: STORAGE_KEY,
  global: self,
  version: 2,
})
asyncQ.waterfall([
  () => loadStateFromPersistence(),
  (initState) => setupController(initState),
])
.then(() => console.log('MetaMask initialization complete.'))
.catch((err) => {
  console.log('WHILE SETTING UP:')
  console.error(err)
})

// initialization flow

//
// State and Persistence
//
function loadStateFromPersistence() {
  // migrations
  let migrator = new Migrator({ migrations })
  const initialState = migrator.generateInitialState(firstTimeState)
  dbController.initialState = initialState
  return dbController.open()
  .then((versionedData) => migrator.migrateData(versionedData))
  .then((versionedData) => {
    dbController.put(versionedData)
    return Promise.resolve(versionedData)
  })
  .then((versionedData) => Promise.resolve(versionedData.data))
}

function setupController (initState, client) {

  //
  // MetaMask Controller
  //

  const controller = new MetamaskController({
    // User confirmation callbacks:
    showUnconfirmedMessage: triggerUi,
    unlockAccountMessage: triggerUi,
    showUnapprovedTx: triggerUi,
    // initial state
    initState,
  })
  global.metamaskController = controller

  // setup state persistence
  // pipe(
  //   controller.store,
  //   storeTransform(versionifyData),
  //   diskStore
  // )
  controller.store.subscribe((state) => {
    versionifyData(state)
    .then((versionedData) => dbController.put(versionedData))
    .catch((err) => {console.error(err)})
  })
  function versionifyData(state) {
    return dbController.get()
    .then((rawData) => {
      return Promise.resolve({
        data: state,
        meta: rawData.meta,
      })}
    )
  }

  //
  // connect to other contexts
  //
  /*
  need to write a service worker stream for this
  */
  connectionListener.on('remote', (portStream, messageEvent) => {
    console.log('REMOTE CONECTION FOUND***********')
    connectRemote(portStream, messageEvent.data.context)
  })

  function connectRemote (connectionStream, context) {
    var isMetaMaskInternalProcess = (context !== 'dapp')
    if (isMetaMaskInternalProcess) {
      // communication with popup
      controller.setupTrustedCommunication(connectionStream, 'MetaMask')
      popupIsOpen = true
    } else {
      // communication with page
      setupUntrustedCommunication(connectionStream, originDomain)
    }
  }

  function setupUntrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    controller.setupProviderConnection(mx.createStream('provider'), originDomain)
    controller.setupPublicConfig(mx.createStream('publicConfig'))
  }

  function setupTrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    controller.setupProviderConnection(mx.createStream('provider'), originDomain)
  }
  //
  // User Interface setup
  //
  return Promise.resolve()

}

// // //
// // // Etc...
// // //

// // // popup trigger

/*send a message to the client that has focus and tell it to open a window*/
function triggerUi () {
}
