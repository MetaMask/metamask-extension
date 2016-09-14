const urlUtil = require('url')
const extend = require('xtend')
const Dnode = require('dnode')
const eos = require('end-of-stream')
const PortStream = require('./lib/port-stream.js')
const notification = require('./lib/notifications.js')
const messageManager = require('./lib/message-manager')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const MetamaskController = require('./metamask-controller')
const extension = require('./lib/extension')

const STORAGE_KEY = 'metamask-config'
var popupIsOpen = false

const controller = new MetamaskController({
  // User confirmation callbacks:
  showUnconfirmedMessage: triggerUi,
  unlockAccountMessage: triggerUi,
  showUnconfirmedTx: triggerUi,
  // Persistence Methods:
  setData,
  loadData,
})
const idStore = controller.idStore

function triggerUi () {
  if (!popupIsOpen) notification.show()
}
// On first install, open a window to MetaMask website to how-it-works.

extension.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    extension.tabs.create({url: 'https://metamask.io/#how-it-works'})
  }
})

//
// connect to other contexts
//

extension.runtime.onConnect.addListener(connectRemote)
function connectRemote (remotePort) {
  var isMetaMaskInternalProcess = remotePort.name === 'popup' || remotePort.name === 'notification'
  var portStream = new PortStream(remotePort)
  if (isMetaMaskInternalProcess) {
    // communication with popup
    remotePort.name === 'popup' ? popupIsOpen = true : popupIsOpen = false
    setupTrustedCommunication(portStream, 'MetaMask', remotePort.name)
  } else {
    // communication with page
    var originDomain = urlUtil.parse(remotePort.sender.url).hostname
    setupUntrustedCommunication(portStream, originDomain)
  }
}

function setupUntrustedCommunication (connectionStream, originDomain) {
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  controller.setupProviderConnection(mx.createStream('provider'), originDomain)
  controller.setupPublicConfig(mx.createStream('publicConfig'))
}

function setupTrustedCommunication (connectionStream, originDomain, metamaskContext) {
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'))
  controller.setupProviderConnection(mx.createStream('provider'), originDomain)
  if (metamaskContext === 'popup') popupIsOpen = true
}

//
// remote features
//

function setupControllerConnection (stream) {
  controller.stream = stream
  var api = controller.getApi()
  var dnode = Dnode(api)
  stream.pipe(dnode).pipe(stream)
  dnode.on('remote', (remote) => {
    // push updates to popup
    controller.ethStore.on('update', controller.sendUpdate.bind(controller))
    controller.listeners.push(remote)
    idStore.on('update', controller.sendUpdate.bind(controller))

    // teardown on disconnect
    eos(stream, () => {
      controller.ethStore.removeListener('update', controller.sendUpdate.bind(controller))
      popupIsOpen = false
    })
  })
}

//
// plugin badge text
//

idStore.on('update', updateBadge)

function updateBadge (state) {
  var label = ''
  var unconfTxs = controller.configManager.unconfirmedTxs()
  var unconfTxLen = Object.keys(unconfTxs).length
  var unconfMsgs = messageManager.unconfirmedMsgs()
  var unconfMsgLen = Object.keys(unconfMsgs).length
  var count = unconfTxLen + unconfMsgLen
  if (count) {
    label = String(count)
  }
  extension.browserAction.setBadgeText({ text: label })
  extension.browserAction.setBadgeBackgroundColor({ color: '#506F8B' })
}

function loadData () {
  var oldData = getOldStyleData()
  var newData
  try {
    newData = JSON.parse(window.localStorage[STORAGE_KEY])
  } catch (e) {}

  var data = extend({
    meta: {
      version: 0,
    },
    data: {
      config: {
        provider: {
          type: 'testnet',
        },
      },
    },
  }, oldData || null, newData || null)
  return data
}

function getOldStyleData () {
  var config, wallet, seedWords

  var result = {
    meta: { version: 0 },
    data: {},
  }

  try {
    config = JSON.parse(window.localStorage['config'])
    result.data.config = config
  } catch (e) {}
  try {
    wallet = JSON.parse(window.localStorage['lightwallet'])
    result.data.wallet = wallet
  } catch (e) {}
  try {
    seedWords = window.localStorage['seedWords']
    result.data.seedWords = seedWords
  } catch (e) {}

  return result
}

function setData (data) {
  window.localStorage[STORAGE_KEY] = JSON.stringify(data)
}
