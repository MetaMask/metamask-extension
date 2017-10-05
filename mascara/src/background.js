global.window = global

const SwGlobalListener = require('sw-stream/lib/sw-global-listener.js')
const connectionListener = new SwGlobalListener(global)
const setupMultiplex = require('../../app/scripts/lib/stream-utils.js').setupMultiplex

const DbController = require('idb-global')

const SwPlatform = require('../../app/scripts/platforms/sw')
const MetamaskController = require('../../app/scripts/metamask-controller')

const Migrator = require('../../app/scripts/lib/migrator/')
const migrations = require('../../app/scripts/migrations/')
const firstTimeState = require('../../app/scripts/first-time-state')

const STORAGE_KEY = 'metamask-config'
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
global.metamaskPopupIsOpen = false

const log = require('loglevel')
global.log = log
log.setDefaultLevel(METAMASK_DEBUG ? 'debug' : 'warn')

global.addEventListener('install', function (event) {
  event.waitUntil(global.skipWaiting())
})
global.addEventListener('activate', function (event) {
  event.waitUntil(global.clients.claim())
})

console.log('inside:open')


// // state persistence
const dbController = new DbController({
  key: STORAGE_KEY,
})
loadStateFromPersistence()
.then((initState) => setupController(initState))
.then(() => console.log('MetaMask initialization complete.'))
.catch((err) => console.error('WHILE SETTING UP:', err))

//
// State and Persistence
//
async function loadStateFromPersistence () {
  // migrations
  const migrator = new Migrator({ migrations })
  const initialState = migrator.generateInitialState(firstTimeState)
  dbController.initialState = initialState
  const versionedData = await dbController.open()
  const migratedData = await migrator.migrateData(versionedData)
  await dbController.put(migratedData)
  return migratedData.data
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
    .catch((err) => { console.error(err) })
  })
  function versionifyData (state) {
    return dbController.get()
    .then((rawData) => {
      return Promise.resolve({
        data: state,
        meta: rawData.meta,
      })
}
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
      global.metamaskPopupIsOpen = true
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

  //
  // User Interface setup
  //
  return Promise.resolve()

}
// // this will be useful later but commented out for linting for now (liiiinting)
// function sendMessageToAllClients (message) {
//   global.clients.matchAll().then(function (clients) {
//     clients.forEach(function (client) {
//       client.postMessage(message)
//     })
//   })
// }

function noop () {}
