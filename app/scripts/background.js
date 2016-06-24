const urlUtil = require('url')
const Dnode = require('dnode')
const eos = require('end-of-stream')
const PortStream = require('./lib/port-stream.js')
const createUnlockRequestNotification = require('./lib/notifications.js').createUnlockRequestNotification
const createTxNotification = require('./lib/notifications.js').createTxNotification
const createMsgNotification = require('./lib/notifications.js').createMsgNotification
const configManager = require('./lib/config-manager-singleton')
const messageManager = require('./lib/message-manager')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex

const BackgroundController = require('./background-controller')

const controller = new BackgroundController({
  showUnconfirmedMessage,
  unlockAccountMessage,
  showUnconfirmedTx,
})
const idStore = controller.idStore

function unlockAccountMessage() {
  createUnlockRequestNotification({
    title: 'Account Unlock Request',
  })
}

function showUnconfirmedMessage (msgParams, msgId) {
  createMsgNotification({
    title: 'New Unsigned Message',
    msgParams: msgParams,
    confirm: idStore.approveMessage.bind(idStore, msgId, noop),
    cancel: idStore.cancelMessage.bind(idStore, msgId),
  })
}

function showUnconfirmedTx(txParams, txData, onTxDoneCb) {
  createTxNotification({
    title: 'New Unsigned Transaction',
    txParams: txParams,
    confirm: idStore.approveTransaction.bind(idStore, txData.id, noop),
    cancel: idStore.cancelTransaction.bind(idStore, txData.id),
  })
}

//
// connect to other contexts
//

chrome.runtime.onConnect.addListener(connectRemote)
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
  var api = controller.api
  var dnode = Dnode(api)
  stream.pipe(dnode).pipe(stream)
  dnode.on('remote', function() {
    // push updates to popup
    controller.ethStore.on('update', controller.sendUpdate)
    idStore.on('update', controller.sendUpdate)

    // teardown on disconnect
    eos(stream, () => {
      controller.ethStore.removeListener('update', controller.sendUpdate)
    })
  })

}

//
// plugin badge text
//

idStore.on('update', updateBadge)

function updateBadge (state) {
  var label = ''
  var unconfTxs = configManager.unconfirmedTxs()
  var unconfTxLen = Object.keys(unconfTxs).length
  var unconfMsgs = messageManager.unconfirmedMsgs()
  var unconfMsgLen = Object.keys(unconfMsgs).length
  var count = unconfTxLen + unconfMsgLen
  if (count) {
    label = String(count)
  }
  chrome.browserAction.setBadgeText({ text: label })
  chrome.browserAction.setBadgeBackgroundColor({ color: '#506F8B' })
}

function noop () {}
