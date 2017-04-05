global.window = global
const pipe = require('pump')

const SwGlobalListener = require('sw-stream/lib/sw-global-listener.js')
const connectionListener = new SwGlobalListener(self)
const setupMultiplex = require('../../app/scripts/lib/stream-utils.js').setupMultiplex
const PortStream = require('../../app/scripts/lib/port-stream.js')

const DbController = require('./lib/index-db-controller')

const SwPlatform = require('../../app/scripts/platforms/sw')
const MetamaskController = require('../../app/scripts/metamask-controller')
const extension = {} //require('../../app/scripts/lib/extension')

const storeTransform = require('obs-store/lib/transform')
const Migrator = require('../../app/scripts/lib/migrator/')
const migrations = require('../../app/scripts/migrations/')
const firstTimeState = require('../../app/scripts/first-time-state')

const STORAGE_KEY = 'metamask-config'
// const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
const METAMASK_DEBUG = true
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
  version: 2,
})
loadStateFromPersistence()
.then((initState) => setupController(initState))
.then(() => console.log('MetaMask initialization complete.'))
.catch((err) => console.error('WHILE SETTING UP:', err))

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

  const platform = new SwPlatform()

  const controller = new MetamaskController({
    // platform specific implementation
    platform,
    // User confirmation callbacks:
    showUnconfirmedMessage: noop,
    unlockAccountMessage: noop,
    showUnapprovedTx: noop,
    // initial state
    initState,
  })
  global.metamaskController = controller

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

  connectionListener.on('remote', (portStream, messageEvent) => {
    console.log('REMOTE CONECTION FOUND***********')
    connectRemote(portStream, messageEvent.data.context)
  })

  function connectRemote (connectionStream, context) {
    var isMetaMaskInternalProcess = (context === 'popup')
    if (isMetaMaskInternalProcess) {
      // communication with popup
      controller.setupTrustedCommunication(connectionStream, 'MetaMask')
      popupIsOpen = true
    } else {
      // communication with page
      setupUntrustedCommunication(connectionStream, context)
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
function noop () {}
