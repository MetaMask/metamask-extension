const {EventEmitter} = require('events')
const promisify = require('pify')
const Dnode = require('dnode')
const Eth = require('ethjs')
const EthQuery = require('eth-query')
const PortStream = require('extension-port-stream')
const extension = require('extensionizer')
const log = require('loglevel')
const launchMetamaskUi = promisify(require('../../ui'))
const StreamProvider = require('web3-stream-provider')
const {setupMultiplex} = require('./lib/stream-utils.js')
const ExtensionPlatform = require('./platforms/extension')
const NotificationManager = require('./lib/notification-manager')
const setupSentry = require('./lib/setupSentry')
const { getEnvironmentType } = require('./lib/util')
const { ENVIRONMENT_TYPE_NOTIFICATION, ENVIRONMENT_TYPE_FULLSCREEN } = require('./lib/enums')

const notificationManager = new NotificationManager()

module.exports = startPopup

/**
 * Starts the MetaMask popup UI
 *
 * @param {React.Component} Root Root UI component
 */
async function startPopup (Root) {
  // create platform global
  global.platform = new ExtensionPlatform()

  // setup sentry error reporting
  const release = global.platform.getVersion()
  setupSentry({ release, getState })
  // provide app state to append to error logs
  function getState () {
    // get app state
    const state = window.getCleanAppState()
    // remove unnecessary data
    delete state.localeMessages
    delete state.metamask.recentBlocks
    // return state to be added to request
    return state
  }

  // identify window type (popup, notification)
  const windowType = getEnvironmentType(window.location.href)
  global.METAMASK_UI_TYPE = windowType
  closePopupIfOpen(windowType)

  // setup stream to background
  const extensionPort = extension.runtime.connect({ name: windowType })
  const connectionStream = new PortStream(extensionPort)

  // start ui
  const container = document.getElementById('app-content')
  const backgroundConnection = await connectToAccountManager(connectionStream)

  let store
  try {
    store = await launchMetamaskUi({ container, backgroundConnection, Root })
  } catch (error) {
    container.innerHTML = '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>'
    container.style.height = '80px'
    log.error(error.stack)
    throw error
  }

  const state = store.getState()
  const { metamask: { completedOnboarding } = {} } = state

  if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
    global.platform.openExtensionInBrowser()
    return
  }
}

function closePopupIfOpen (windowType) {
  if (windowType !== ENVIRONMENT_TYPE_NOTIFICATION) {
    // should close only chrome popup
    notificationManager.closePopup()
  }
}

/**
 * Establishes streamed connections to background scripts and a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream PortStream instance establishing a background connection
 * @param {Function} cb Called when controller connection is established
 */
async function connectToAccountManager (connectionStream) {
  // setup communication with background
  // setup multiplexing
  const mx = setupMultiplex(connectionStream)
  // connect features
  setupWeb3Connection(mx.createStream('provider'))
  const promisifiedSetupControllerConnection = promisify(setupControllerConnection)
  return await promisifiedSetupControllerConnection(mx.createStream('controller'))
}

/**
 * Establishes a streamed connection to a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream PortStream instance establishing a background connection
 */
function setupWeb3Connection (connectionStream) {
  const providerStream = new StreamProvider()
  providerStream.pipe(connectionStream).pipe(providerStream)
  connectionStream.on('error', console.error.bind(console))
  providerStream.on('error', console.error.bind(console))
  global.ethereumProvider = providerStream
  global.ethQuery = new EthQuery(providerStream)
  global.eth = new Eth(providerStream)
}

/**
 * Establishes a streamed connection to the background account manager
 *
 * @param {PortDuplexStream} connectionStream PortStream instance establishing a background connection
 * @param {Function} cb Called when the remote account manager connection is established
 */
function setupControllerConnection (connectionStream, cb) {
  // this is a really sneaky way of adding EventEmitter api
  // to a bi-directional dnode instance
  const eventEmitter = new EventEmitter()
  const backgroundDnode = Dnode({
    sendUpdate: function (state) {
      eventEmitter.emit('update', state)
    },
  })
  connectionStream.pipe(backgroundDnode).pipe(connectionStream)
  backgroundDnode.once('remote', function (backgroundConnection) {
    // setup push events
    backgroundConnection.on = eventEmitter.on.bind(eventEmitter)
    cb(null, backgroundConnection)
  })
}
