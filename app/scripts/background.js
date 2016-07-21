const urlUtil = require('url')
const extend = require('xtend')
const Dnode = require('dnode')
const eos = require('end-of-stream')
const PortStream = require('./lib/port-stream.js')
const createUnlockRequestNotification = require('./lib/notifications.js').createUnlockRequestNotification
const createTxNotification = require('./lib/notifications.js').createTxNotification
const createMsgNotification = require('./lib/notifications.js').createMsgNotification
const messageManager = require('./lib/message-manager')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const MetamaskController = require('./metamask-controller')
const extension = require('./lib/extension')

const STORAGE_KEY = 'metamask-config'

const controller = new MetamaskController({
  // User confirmation callbacks:
  showUnconfirmedMessage,
  unlockAccountMessage,
  showUnconfirmedTx,
  // Persistence Methods:
  setData,
  loadData,
})
const idStore = controller.idStore

function unlockAccountMessage () {
  createUnlockRequestNotification({
    title: 'Account Unlock Request',
  })
}

function showUnconfirmedMessage (msgParams, msgId) {
  var controllerState = controller.getState()

  createMsgNotification({
    imageifyIdenticons: false,
    txData: {
      msgParams: msgParams,
      time: (new Date()).getTime(),
    },
    identities: controllerState.identities,
    accounts: controllerState.accounts,
    onConfirm: idStore.approveMessage.bind(idStore, msgId, noop),
    onCancel: idStore.cancelMessage.bind(idStore, msgId),
  })
}

function showUnconfirmedTx (txParams, txData, onTxDoneCb) {
  var controllerState = controller.getState()

  createTxNotification({
    imageifyIdenticons: false,
    txData: {
      txParams: txParams,
      time: (new Date()).getTime(),
    },
    identities: controllerState.identities,
    accounts: controllerState.accounts,
    onConfirm: idStore.approveTransaction.bind(idStore, txData.id, noop),
    onCancel: idStore.cancelTransaction.bind(idStore, txData.id),
  })
}

//
// connect to other contexts
//

extension.runtime.onConnect.addListener(connectRemote)
function connectRemote (remotePort) {
  var isMetaMaskInternalProcess = (remotePort.name === 'popup')
  var portStream = new PortStream(remotePort)
  if (isMetaMaskInternalProcess) {
    // communication with popup
    setupTrustedCommunication(portStream, 'MetaMask')
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

function setupTrustedCommunication (connectionStream, originDomain) {
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'))
  controller.setupProviderConnection(mx.createStream('provider'), originDomain)
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
    controller.remote = remote
    idStore.on('update', controller.sendUpdate.bind(controller))

    // teardown on disconnect
    eos(stream, () => {
      controller.ethStore.removeListener('update', controller.sendUpdate.bind(controller))
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

function noop () {}
