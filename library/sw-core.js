global.window = global
const SWGlobal = self
const urlUtil = require('url')
const endOfStream = require('end-of-stream')
const asyncQ = require('async-q')
const pipe = require('pump')

const SwGlobalListener = require('sw-stream/lib/sw-global-listener.js')
const connectionListener = new SwGlobalListener(self)
const setupMultiplex = require('../app/scripts/lib/stream-utils.js').setupMultiplex
const PortStream = require('../app/scripts/lib/port-stream.js')
// const notification = require('../app/scripts/lib/notifications.js')

const DbController = require('./controllers/index-db-controller')

const MetamaskController = require('../app/scripts/metamask-controller')
// const extension = require('../app/scripts/lib/extension')
// const LocalStorageStore = require('obs-store/lib/localStorage')
const storeTransform = require('obs-store/lib/transform')
const Migrator = require('../app/scripts/lib/migrator/')
const migrations = require('../app/scripts/migrations/')
const firstTimeState = require('../app/scripts/first-time-state')

const STORAGE_KEY = 'metamask-config'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
let popupIsOpen = false

self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim())
})

self.onsync = function (syncEvent) {
// What is done when a sync even is fired
  console.log('inside:sync')
  var focused
  self.clients.matchAll()
  .then(clients => {
    clients.forEach(function(client) {

    })
  })
}



console.log('inside:open')


// // state persistence
let diskStore
const dbController = new DbController({
  key: STORAGE_KEY,
  global: self,
  version: 2,
  initialState: {
    dataStore: {
      meta: 2,
      data: firstTimeState,
    },
  },
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
  .then((stuff) => {
    return dbController.get('dataStore')
  })
  .then((data) => {
    if (!data) {
      return dbController._add('dataStore', initialState)
      .then(() => dbController.get('dataStore'))
      .then((versionedData) => Promise.resolve(versionedData.data))
    }

    return Promise.resolve(data.data)
  })
  .catch((err) => console.error(err))
  /*
    need to get migrations working
  */

  // return asyncQ.waterfall([
  //   // read from disk
  //   () => Promise.resolve(diskStore || initialState),
  //   // migrate data
  //   (versionedData) => migrator.migrateData(versionedData),
  //   // write to disk
  //   (versionedData) => {
  //     diskStore.put(versionedData)
  //     return Promise.resolve(versionedData)
  //   },
  //   // resolve to just data
  //   (versionedData) => Promise.resolve(versionedData.data),
  // ])
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
  pipe(
    controller.store,
    storeTransform(versionifyData),
    diskStore
  )

  function versionifyData(state) {
    let versionedData = diskStore.getState()
    versionedData.data = state
    return versionedData
  }

  //
  // connect to other contexts
  //
  /*
  need to write a service worker stream for this
  */
  // var connectionStream = new ParentStream()
  connectionListener.on('remote', (portStream, messageEvent) => {
    debugger
    connectRemote(connectionStream, messageEvent.origin)
  })

  function connectRemote (connectionStream, originDomain) {
    var isMetaMaskInternalProcess = (originDomain === 'http://localhost:9001')
    if (isMetaMaskInternalProcess) {
      // communication with popup
      controller.setupTrustedCommunication(connectionStream, 'MetaMask')
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
function triggerUi () {
  if (!popupIsOpen) notification.show()
}
