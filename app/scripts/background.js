const urlUtil = require('url')
const endOfStream = require('end-of-stream')
const asyncQ = require('async-q')
const pipe = require('pump')
const LocalStorageStore = require('obs-store/lib/localStorage')
const storeTransform = require('obs-store/lib/transform')
const Migrator = require('./lib/migrator/')
const migrations = require('./migrations/')
const PortStream = require('./lib/port-stream.js')
const notification = require('./lib/notifications.js')
const MetamaskController = require('./metamask-controller')
const extension = require('./lib/extension')
const firstTimeState = require('./first-time-state')

const STORAGE_KEY = 'metamask-config'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

let popupIsOpen = false

// state persistence
const diskStore = new LocalStorageStore({ storageKey: STORAGE_KEY })

// initialization flow
asyncQ.waterfall([
  () => loadStateFromPersistence(),
  (initState) => setupController(initState),
])
.then(() => console.log('MetaMask initialization complete.'))
.catch((err) => { console.error(err) })

//
// State and Persistence
//

function loadStateFromPersistence() {
  // migrations
  let migrator = new Migrator({ migrations })
  let initialState = migrator.generateInitialState(firstTimeState)
  return asyncQ.waterfall([
    // read from disk
    () => Promise.resolve(diskStore.getState() || initialState),
    // migrate data
    (versionedData) => migrator.migrateData(versionedData),
    // write to disk
    (versionedData) => {
      diskStore.putState(versionedData)
      return Promise.resolve(versionedData)
    },
    // resolve to just data
    (versionedData) => Promise.resolve(versionedData.data),
  ])
}

function setupController (initState) {

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

  extension.runtime.onConnect.addListener(connectRemote)
  function connectRemote (remotePort) {
    var isMetaMaskInternalProcess = remotePort.name === 'popup' || remotePort.name === 'notification'
    var portStream = new PortStream(remotePort)
    if (isMetaMaskInternalProcess) {
      // communication with popup
      popupIsOpen = popupIsOpen || (remotePort.name === 'popup')
      controller.setupTrustedCommunication(portStream, 'MetaMask', remotePort.name)
      // record popup as closed
      if (remotePort.name === 'popup') {
        endOfStream(portStream, () => {
          popupIsOpen = false
        })
      }
    } else {
      // communication with page
      var originDomain = urlUtil.parse(remotePort.sender.url).hostname
      controller.setupUntrustedCommunication(portStream, originDomain)
    }
  }

  //
  // User Interface setup
  //

  updateBadge()
  controller.txManager.on('updateBadge', updateBadge)
  controller.messageManager.on('updateBadge', updateBadge)

  // plugin badge text
  function updateBadge () {
    var label = ''
    var unapprovedTxCount = controller.txManager.unapprovedTxCount
    var unapprovedMsgCount = controller.messageManager.unapprovedMsgCount
    var count = unapprovedTxCount + unapprovedMsgCount
    if (count) {
      label = String(count)
    }
    extension.browserAction.setBadgeText({ text: label })
    extension.browserAction.setBadgeBackgroundColor({ color: '#506F8B' })
  }

  return Promise.resolve()

}

//
// Etc...
//

// popup trigger
function triggerUi () {
  if (!popupIsOpen) notification.show()
}

// On first install, open a window to MetaMask website to how-it-works.
extension.runtime.onInstalled.addListener(function (details) {
  if ((details.reason === 'install') && (!METAMASK_DEBUG)) {
    extension.tabs.create({url: 'https://metamask.io/#how-it-works'})
  }
})
