const urlUtil = require('url')
const endOfStream = require('end-of-stream')
const pump = require('pump')
const debounce = require('debounce-stream')
const log = require('loglevel')
const extension = require('extensionizer')
const LocalStorageStore = require('obs-store/lib/localStorage')
const LocalStore = require('./lib/local-store')
const storeTransform = require('obs-store/lib/transform')
const asStream = require('obs-store/lib/asStream')
const ExtensionPlatform = require('./platforms/extension')
const Migrator = require('./lib/migrator/')
const migrations = require('./migrations/')
const PortStream = require('./lib/port-stream.js')
const NotificationManager = require('./lib/notification-manager.js')
const MetamaskController = require('./metamask-controller')
const firstTimeState = require('./first-time-state')
const setupRaven = require('./lib/setupRaven')
const reportFailedTxToSentry = require('./lib/reportFailedTxToSentry')
const setupMetamaskMeshMetrics = require('./lib/setupMetamaskMeshMetrics')
const EdgeEncryptor = require('./edge-encryptor')
const getFirstPreferredLangCode = require('./lib/get-first-preferred-lang-code')
const getObjStructure = require('./lib/getObjStructure')

const STORAGE_KEY = 'metamask-config'
const METAMASK_DEBUG = process.env.METAMASK_DEBUG

window.log = log
log.setDefaultLevel(METAMASK_DEBUG ? 'debug' : 'warn')

const platform = new ExtensionPlatform()
const notificationManager = new NotificationManager()
global.METAMASK_NOTIFIER = notificationManager

// setup sentry error reporting
const release = platform.getVersion()
const raven = setupRaven({ release })

// browser check if it is Edge - https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
// Internet Explorer 6-11
const isIE = !!document.documentMode
// Edge 20+
const isEdge = !isIE && !!window.StyleMedia

let popupIsOpen = false
let notificationIsOpen = false
let openMetamaskTabsIDs = {}

// state persistence
const diskStore = new LocalStorageStore({ storageKey: STORAGE_KEY })
const localStore = new LocalStore()
let versionedData

// initialization flow
initialize().catch(log.error)

// setup metamask mesh testing container
setupMetamaskMeshMetrics()

async function initialize () {
  const initState = await loadStateFromPersistence()
  const initLangCode = await getFirstPreferredLangCode()
  await setupController(initState, initLangCode)
  log.debug('MetaMask initialization complete.')
}

//
// State and Persistence
//

async function loadStateFromPersistence () {
  // migrations
  const migrator = new Migrator({ migrations })

  // read from disk
  // first from preferred, async API:
  versionedData = (await localStore.get()) ||
                  diskStore.getState() ||
                  migrator.generateInitialState(firstTimeState)

  // check if somehow state is empty
  // this should never happen but new error reporting suggests that it has
  // for a small number of users
  // https://github.com/metamask/metamask-extension/issues/3919
  if (versionedData && !versionedData.data) {
    // try to recover from diskStore incase only localStore is bad
    const diskStoreState = diskStore.getState()
    if (diskStoreState && diskStoreState.data) {
      // we were able to recover (though it might be old)
      versionedData = diskStoreState
      const vaultStructure = getObjStructure(versionedData)
      raven.captureMessage('MetaMask - Empty vault found - recovered from diskStore', {
        // "extra" key is required by Sentry
        extra: { vaultStructure },
      })
    } else {
      // unable to recover, clear state
      versionedData = migrator.generateInitialState(firstTimeState)
      raven.captureMessage('MetaMask - Empty vault found - unable to recover')
    }
  }

  // report migration errors to sentry
  migrator.on('error', (err) => {
    // get vault structure without secrets
    const vaultStructure = getObjStructure(versionedData)
    raven.captureException(err, {
      // "extra" key is required by Sentry
      extra: { vaultStructure },
    })
  })

  // migrate data
  versionedData = await migrator.migrateData(versionedData)
  if (!versionedData) {
    throw new Error('MetaMask - migrator returned undefined')
  }

  // write to disk
  if (localStore.isSupported) {
    localStore.set(versionedData)
  } else {
    // throw in setTimeout so as to not block boot
    setTimeout(() => {
      throw new Error('MetaMask - Localstore not supported')
    })
  }

  // return just the data
  return versionedData.data
}

function setupController (initState, initLangCode) {
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
    // initial locale code
    initLangCode,
    // platform specific api
    platform,
    encryptor: isEdge ? new EdgeEncryptor() : undefined,
  })
  global.metamaskController = controller

  // report failed transactions to Sentry
  controller.txController.on(`tx:status-update`, (txId, status) => {
    if (status !== 'failed') return
    const txMeta = controller.txController.txStateManager.getTx(txId)
    reportFailedTxToSentry({ raven, txMeta })
  })

  // setup state persistence
  pump(
    asStream(controller.store),
    debounce(1000),
    storeTransform(versionifyData),
    storeTransform(persistData),
    (error) => {
      log.error('MetaMask - Persistence pipeline failed', error)
    }
  )

  function versionifyData (state) {
    versionedData.data = state
    return versionedData
  }

  function persistData(state) {
    if (!state) {
      throw new Error('MetaMask - updated state is missing', state)
    }
    if (!state.data) {
      throw new Error('MetaMask - updated state does not have data', state)
    }
    if (localStore.isSupported) {
      localStore.set(state)
      .catch((err) => {
        log.error('error setting state in local store:', err)
      })
    }
    return state
  }

  //
  // connect to other contexts
  //

  extension.runtime.onConnect.addListener(connectRemote)
  function connectRemote (remotePort) {
    const isMetaMaskInternalProcess = remotePort.name === 'popup' || remotePort.name === 'notification'
    const portStream = new PortStream(remotePort)
    if (isMetaMaskInternalProcess) {
      // communication with popup
      popupIsOpen = popupIsOpen || (remotePort.name === 'popup')
      controller.setupTrustedCommunication(portStream, 'MetaMask')
      // record popup as closed
      if (remotePort.sender.url.match(/home.html$/)) {
        openMetamaskTabsIDs[remotePort.sender.tab.id] = true
      }
      if (remotePort.name === 'popup') {
        endOfStream(portStream, () => {
          popupIsOpen = false
          if (remotePort.sender.url.match(/home.html$/)) {
            openMetamaskTabsIDs[remotePort.sender.tab.id] = false
          }
        })
      }
      if (remotePort.name === 'notification') {
        endOfStream(portStream, () => {
          notificationIsOpen = false
        })
      }
    } else {
      // communication with page
      const originDomain = urlUtil.parse(remotePort.sender.url).hostname
      controller.setupUntrustedCommunication(portStream, originDomain)
    }
  }

  //
  // User Interface setup
  //

  updateBadge()
  controller.txController.on('update:badge', updateBadge)
  controller.messageManager.on('updateBadge', updateBadge)
  controller.personalMessageManager.on('updateBadge', updateBadge)

  // plugin badge text
  function updateBadge () {
    var label = ''
    var unapprovedTxCount = controller.txController.getUnapprovedTxCount()
    var unapprovedMsgCount = controller.messageManager.unapprovedMsgCount
    var unapprovedPersonalMsgs = controller.personalMessageManager.unapprovedPersonalMsgCount
    var unapprovedTypedMsgs = controller.typedMessageManager.unapprovedTypedMessagesCount
    var count = unapprovedTxCount + unapprovedMsgCount + unapprovedPersonalMsgs + unapprovedTypedMsgs
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
  extension.tabs.query({ active: true }, (tabs) => {
    const currentlyActiveMetamaskTab = tabs.find(tab => openMetamaskTabsIDs[tab.id])
    if (!popupIsOpen && !currentlyActiveMetamaskTab && !notificationIsOpen) notificationManager.showPopup()
    notificationIsOpen = true
  })
}

// On first install, open a window to MetaMask website to how-it-works.
extension.runtime.onInstalled.addListener(function (details) {
  if ((details.reason === 'install') && (!METAMASK_DEBUG)) {
    extension.tabs.create({url: 'https://akroma.io/browser-extension'})
  }
})
