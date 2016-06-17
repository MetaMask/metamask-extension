const urlUtil = require('url')
const Dnode = require('dnode')
const eos = require('end-of-stream')
const combineStreams = require('pumpify')
const extend = require('xtend')
const EthStore = require('eth-store')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const ObjectMultiplex = require('./lib/obj-multiplex')
const PortStream = require('./lib/port-stream.js')
const IdentityStore = require('./lib/idStore')
const createUnlockRequestNotification = require('./lib/notifications.js').createUnlockRequestNotification
const createTxNotification = require('./lib/notifications.js').createTxNotification
const createMsgNotification = require('./lib/notifications.js').createMsgNotification
const configManager = require('./lib/config-manager-singleton')
const messageManager = require('./lib/message-manager')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const HostStore = require('./lib/remote-store.js').HostStore
const Web3 = require('web3')

//
// connect to other contexts
//

chrome.runtime.onConnect.addListener(connectRemote)
function connectRemote(remotePort){
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

function setupUntrustedCommunication(connectionStream, originDomain){
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupProviderConnection(mx.createStream('provider'), originDomain)
  setupPublicConfig(mx.createStream('publicConfig'))
}

function setupTrustedCommunication(connectionStream, originDomain){
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'))
  setupProviderConnection(mx.createStream('provider'), originDomain)
}

//
// state and network
//

var providerConfig = configManager.getProvider()
var idStore = new IdentityStore()

var providerOpts = {
  rpcUrl: configManager.getCurrentRpcAddress(),
  // account mgmt
  getAccounts: function(cb){
    var selectedAddress = idStore.getSelectedAddress()
    var result = selectedAddress ? [selectedAddress] : []
    cb(null, result)
  },
  // tx signing
  approveTransaction: newUnsignedTransaction,
  signTransaction: idStore.signTransaction.bind(idStore),
  // msg signing
  approveMessage: newUnsignedMessage,
  signMessage: idStore.signMessage.bind(idStore),
}
var provider = MetaMaskProvider(providerOpts)
var web3 = new Web3(provider)
idStore.web3 = web3
idStore.getNetwork()

// log new blocks
provider.on('block', function(block){
  console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))

  // Check network when restoring connectivity:
  if (idStore._currentState.network === 'loading') {
    idStore.getNetwork()
  }
})

provider.on('error', idStore.getNetwork.bind(idStore))

var ethStore = new EthStore(provider)
idStore.setStore(ethStore)

function getState(){
  var state = extend(
    ethStore.getState(),
    idStore.getState(),
    configManager.getConfig()
  )
  return state
}

//
// public store
//

// get init state
var initPublicState = extend(
  idStoreToPublic(idStore.getState()),
  configToPublic(configManager.getConfig())
)

var publicConfigStore = new HostStore(initPublicState)

// subscribe to changes
configManager.subscribe(function(state){
  storeSetFromObj(publicConfigStore, configToPublic(state))
})
idStore.on('update', function(state){
  storeSetFromObj(publicConfigStore, idStoreToPublic(state))
})

// idStore substate
function idStoreToPublic(state){
  return {
    selectedAddress: state.selectedAddress,
  }
}
// config substate
function configToPublic(state){
  return {
    provider: state.provider,
  }
}
// dump obj into store
function storeSetFromObj(store, obj){
  Object.keys(obj).forEach(function(key){
    store.set(key, obj[key])
  })
}


//
// remote features
//

function setupPublicConfig(stream){
  var storeStream = publicConfigStore.createStream()
  stream.pipe(storeStream).pipe(stream)
}

function setupProviderConnection(stream, originDomain){

  stream.on('data', function onRpcRequest(payload){
    // Append origin to rpc payload
    payload.origin = originDomain
    // Append origin to signature request
    if (payload.method === 'eth_sendTransaction') {
      payload.params[0].origin = originDomain
    } else if (payload.method === 'eth_sign') {
      payload.params.push({ origin: originDomain })
    }
    // handle rpc request
    provider.sendAsync(payload, function onPayloadHandled(err, response){
      logger(null, payload, response)
      try {
        stream.write(response)
      } catch (err) {
        logger(err)
      }
    })
  })

  function logger(err, request, response){
    if (err) return console.error(err.stack)
    if (!request.isMetamaskInternal) {
      console.log(`RPC (${originDomain}):`, request, '->', response)
      if (response.error) console.error('Error in RPC response:\n'+response.error.message)
    }
  }
}

function setupControllerConnection(stream){
  var dnode = Dnode({
    getState:           function(cb){ cb(null, getState()) },
    setRpcTarget:       setRpcTarget,
    setProviderType:    setProviderType,
    useEtherscanProvider: useEtherscanProvider,
    agreeToDisclaimer:  agreeToDisclaimer,
    // forward directly to idStore
    createNewVault:     idStore.createNewVault.bind(idStore),
    recoverFromSeed:    idStore.recoverFromSeed.bind(idStore),
    submitPassword:     idStore.submitPassword.bind(idStore),
    setSelectedAddress: idStore.setSelectedAddress.bind(idStore),
    approveTransaction: idStore.approveTransaction.bind(idStore),
    cancelTransaction:  idStore.cancelTransaction.bind(idStore),
    signMessage:        idStore.signMessage.bind(idStore),
    cancelMessage:      idStore.cancelMessage.bind(idStore),
    setLocked:          idStore.setLocked.bind(idStore),
    clearSeedWordCache: idStore.clearSeedWordCache.bind(idStore),
    exportAccount:      idStore.exportAccount.bind(idStore),
    revealAccount:      idStore.revealAccount.bind(idStore),
    saveAccountLabel:   idStore.saveAccountLabel.bind(idStore),
    tryPassword:        idStore.tryPassword.bind(idStore),
    recoverSeed:        idStore.recoverSeed.bind(idStore),
  })
  stream.pipe(dnode).pipe(stream)
  dnode.on('remote', function(remote){

    // push updates to popup
    ethStore.on('update', sendUpdate)
    idStore.on('update', sendUpdate)
    // teardown on disconnect
    eos(stream, function unsubscribe(){
      ethStore.removeListener('update', sendUpdate)
    })
    function sendUpdate(){
      var state = getState()
      remote.sendUpdate(state)
    }

  })
}

//
// plugin badge text
//

idStore.on('update', updateBadge)

function updateBadge(state){
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

//
// Add unconfirmed Tx + Msg
//

function newUnsignedTransaction(txParams, onTxDoneCb){
  var state = idStore.getState()
  if (!state.isUnlocked) {
    createUnlockRequestNotification({
      title: 'Account Unlock Request',
    })
    idStore.addUnconfirmedTransaction(txParams, onTxDoneCb, noop)
  } else {
    addUnconfirmedTx(txParams, onTxDoneCb)
  }
}

function newUnsignedMessage(msgParams, cb){
  var state = idStore.getState()
  if (!state.isUnlocked) {
    createUnlockRequestNotification({
      title: 'Account Unlock Request',
    })
    var msgId = idStore.addUnconfirmedMessage(msgParams, cb)
  } else {
    addUnconfirmedMsg(msgParams, cb)
  }
}

function addUnconfirmedTx(txParams, onTxDoneCb){
  idStore.addUnconfirmedTransaction(txParams, onTxDoneCb, function(err, txData){
    if (err) return onTxDoneCb(err)
    createTxNotification({
      title: 'New Unsigned Transaction',
      txParams: txParams,
      confirm: idStore.approveTransaction.bind(idStore, txData.id, noop),
      cancel: idStore.cancelTransaction.bind(idStore, txData.id),
    })
  })
}

function addUnconfirmedMsg(msgParams, cb){
  var msgId = idStore.addUnconfirmedMessage(msgParams, cb)
  createMsgNotification({
    title: 'New Unsigned Message',
    msgParams: msgParams,
    confirm: idStore.approveMessage.bind(idStore, msgId, noop),
    cancel: idStore.cancelMessage.bind(idStore, msgId),
  })
}

//
// config
//

function agreeToDisclaimer(cb) {
  try {
    configManager.setConfirmed(true)
    cb()
  } catch (e) {
    cb(e)
  }
}

// called from popup
function setRpcTarget(rpcTarget){
  configManager.setRpcTarget(rpcTarget)
  chrome.runtime.reload()
  idStore.getNetwork()
}

function setProviderType(type) {
  configManager.setProviderType(type)
  chrome.runtime.reload()
  idStore.getNetwork()
}

function useEtherscanProvider() {
  configManager.useEtherscanProvider()
  chrome.runtime.reload()
}

// util

function noop(){}
