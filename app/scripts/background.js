/*
 * @file The entry point for the web extension singleton process.
 */

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
const {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
} = require('./lib/enums')

const STORAGE_KEY = 'metamask-config'
const METAMASK_DEBUG = process.env.METAMASK_DEBUG

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

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
const openMetamaskTabsIDs = {}

// state persistence
const diskStore = new LocalStorageStore({ storageKey: STORAGE_KEY })
const localStore = new LocalStore()
let versionedData

// initialization flow
initialize().catch(log.error)

// setup metamask mesh testing container
setupMetamaskMeshMetrics()

/*
 * The data emitted from the MetaMaskController.store EventEmitter, also used to initialize the MetaMaskController.
 * @typedef MetaMaskState
 */

/*
 * @typedef VersionedData
 * @property {MetaMaskState} data - The data emitted from MetaMask controller, or used to initialize it.
 * @property {Number} version - The latest migration version that has been run.
 */

/*
 * Initializes the MetaMask controller, and sets up all platform configuration.
 * @returns {Promise} Setup complete.
 */
async function initialize () {
  const initState = await loadStateFromPersistence()
  const initLangCode = await getFirstPreferredLangCode()
  await setupController(initState, initLangCode)
  log.debug('MetaMask initialization complete.')
}

//
// State and Persistence
//

/*
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 * @returns {Promise<MetaMaskState>} Last data emitted from previous instance of MetaMask.
 */
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

/*
 * Initializes the MetaMask Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {Object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {String} initLangCode - The region code for the language preferred by the current user.
 * @returns {Promise} After setup is complete.
 */
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

  /*
   * Assigns the given state to the versioned object (with metadata), and returns that.
   * @param {Object} state - The state object as emitted by the MetaMaskController.
   * @returns {VersionedData} The state object wrapped in an object that includes a metadata key.
   */
  function versionifyData (state) {
    versionedData.data = state
    return versionedData
  }

  function persistData (state) {
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

  const metamaskInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
  }

  const isClientOpenStatus = () => {
    return popupIsOpen || Boolean(Object.keys(openMetamaskTabsIDs).length) || notificationIsOpen
  }

  /*
   * A runtime.Port object, as provided by the browser:
   * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/Port
   * @typedef Port
   * @type Object
   */

  /*
   * Connects a Port to the MetaMask controller via a multiplexed duplex stream.
   * This method identifies trusted (MetaMask) interfaces, and connects them differently from untrusted (web pages).
   * @param {Port} remotePort - The port provided by a new context.
   */
  function connectRemote (remotePort) {
    const processName = remotePort.name
    const isMetaMaskInternalProcess = metamaskInternalProcessHash[processName]
    const portStream = new PortStream(remotePort)

    if (isMetaMaskInternalProcess) {
      // communication with popup
      controller.isClientOpen = true
      controller.setupTrustedCommunication(portStream, 'MetaMask')

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        popupIsOpen = true

        endOfStream(portStream, () => {
          popupIsOpen = false
          controller.isClientOpen = isClientOpenStatus()
        })
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true

        endOfStream(portStream, () => {
          notificationIsOpen = false
          controller.isClientOpen = isClientOpenStatus()
        })
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id
        openMetamaskTabsIDs[tabId] = true

        endOfStream(portStream, () => {
          delete openMetamaskTabsIDs[tabId]
          controller.isClientOpen = isClientOpenStatus()
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

  /*
   * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
   * The number reflects the current number of pending transactions or message signatures needing user approval.
   */
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

/*
 * Opens the browser popup for user confirmation
 */
function triggerUi () {
  extension.tabs.query({ active: true }, tabs => {
    const currentlyActiveMetamaskTab = Boolean(tabs.find(tab => openMetamaskTabsIDs[tab.id]))
    if (!popupIsOpen && !currentlyActiveMetamaskTab && !notificationIsOpen) {
      notificationManager.showPopup()
    }
  })
}

// On first install, open a window to MetaMask website to how-it-works.
extension.runtime.onInstalled.addListener(function (details) {
  if ((details.reason === 'install') && (!METAMASK_DEBUG)) {
    extension.tabs.create({url: 'https://metamask.io/#how-it-works'})
  }
})
