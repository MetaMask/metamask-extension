const Dnode = require('dnode')
const ObjectMultiplex = require('./lib/obj-multiplex')
const eos = require('end-of-stream')
const combineStreams = require('pumpify')
const extend = require('xtend')
const EthStore = require('eth-store')
const PortStream = require('./lib/port-stream.js')
const MetaMaskProvider = require('./lib/zero.js')
const IdentityStore = require('./lib/idStore')
const createTxNotification = require('./lib/tx-notification.js')
const configManager = require('./lib/config-manager-singleton')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const HostStore = require('./lib/remote-store.js').HostStore

//
// connect to other contexts
//

chrome.runtime.onConnect.addListener(connectRemote)
function connectRemote(remotePort){
  var isMetaMaskInternalProcess = (remotePort.name === 'popup')
  var portStream = new PortStream(remotePort)
  if (isMetaMaskInternalProcess) {
    // communication with popup
    setupTrustedCommunication(portStream)
  } else {
    // communication with page
    setupUntrustedCommunication(portStream)
  }
}

function setupUntrustedCommunication(connectionStream){
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupProviderConnection(mx.createStream('provider'))
  setupPublicConfig(mx.createStream('publicConfig'))
}

function setupTrustedCommunication(connectionStream){
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'))
  setupProviderConnection(mx.createStream('provider'))
}

//
// state and network
//

var providerConfig = configManager.getProvider()
var idStore = new IdentityStore()
var providerOpts = {
  rpcUrl: configManager.getCurrentRpcAddress(),
  getAccounts: function(cb){
    var selectedAddress = idStore.getSelectedAddress()
    var result = selectedAddress ? [selectedAddress] : []
    cb(null, result)
  },
  approveTransaction: addUnconfirmedTx,
  signTransaction: idStore.signTransaction.bind(idStore),
}
var provider = MetaMaskProvider(providerOpts)

// log new blocks
provider.on('block', function(block){
  console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
})

var ethStore = new EthStore(provider)
idStore.setStore(ethStore)

// copy idStore substate into public store
var publicConfigStore = new HostStore()
idStore.on('update', function(state){
  publicConfigStore.set('selectedAddress', state.selectedAddress)
})


function getState(){
  var state = extend(
    ethStore.getState(),
    idStore.getState(),
    configManager.getConfig()
  )
  return state
}

// handle rpc requests
function onRpcRequest(remoteStream, payload){
  // console.log('MetaMaskPlugin - incoming payload:', payload)
  provider.sendAsync(payload, function onPayloadHandled(err, response){
    // provider engine errors are included in response objects
    if (!payload.isMetamaskInternal) console.log('MetaMaskPlugin - RPC complete:', payload, '->', response)
    try {
      remoteStream.write(response)
    } catch (err) {
      console.error(err)
    }
  })
}


//
// remote features
//

function setupPublicConfig(stream){
  var storeStream = publicConfigStore.createStream()
  stream.pipe(storeStream).pipe(stream)
}

function setupProviderConnection(stream){
  stream.on('data', onRpcRequest.bind(null, stream))
}

function setupControllerConnection(stream){
  var dnode = Dnode({
    getState:           function(cb){ cb(null, getState()) },
    setRpcTarget:       setRpcTarget,
    useEtherscanProvider: useEtherscanProvider,
    // forward directly to idStore
    createNewVault:     idStore.createNewVault.bind(idStore),
    recoverFromSeed:    idStore.recoverFromSeed.bind(idStore),
    submitPassword:     idStore.submitPassword.bind(idStore),
    setSelectedAddress: idStore.setSelectedAddress.bind(idStore),
    approveTransaction: idStore.approveTransaction.bind(idStore),
    cancelTransaction:  idStore.cancelTransaction.bind(idStore),
    setLocked:          idStore.setLocked.bind(idStore),
    clearSeedWordCache: idStore.clearSeedWordCache.bind(idStore),
    exportAccount:      idStore.exportAccount.bind(idStore),
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
  var count = Object.keys(state.unconfTxs).length
  if (count) {
    label = String(count)
  }
  chrome.browserAction.setBadgeText({ text: label })
  chrome.browserAction.setBadgeBackgroundColor({ color: '#506F8B' })
}

//
// Add unconfirmed Tx
//

function addUnconfirmedTx(txParams, cb){
  var txId = idStore.addUnconfirmedTransaction(txParams, cb)
  createTxNotification({
    title: 'New Unsigned Transaction',
    txParams: txParams,
    confirm: idStore.approveTransaction.bind(idStore, txId, noop),
    cancel: idStore.cancelTransaction.bind(idStore, txId),
  })
}

//
// config
//

// called from popup
function setRpcTarget(rpcTarget){
  configManager.setRpcTarget(rpcTarget)
  chrome.runtime.reload()
}

function useEtherscanProvider() {
  configManager.useEtherscanProvider()
  chrome.runtime.reload()
}

// util

function noop(){}
