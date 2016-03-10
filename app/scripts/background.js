const Dnode = require('dnode')
const Multiplex = require('multiplex')
const Through = require('through2')
const eos = require('end-of-stream')
const combineStreams = require('pumpify')
const extend = require('xtend')
const EthStore = require('eth-store')
const PortStream = require('./lib/port-stream.js')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const IdentityStore = require('./lib/idStore')

console.log('ready to roll')

//
// connect to other contexts
//

chrome.runtime.onConnect.addListener(connectRemote)
function connectRemote(remotePort){
  var isMetaMaskInternalProcess = (remotePort.name === 'popup')
  var portStream = new PortStream(remotePort)
  if (isMetaMaskInternalProcess) {
    // communication with popup
    handleInternalCommunication(portStream)
  } else {
    // communication with page
    handleEthRpcRequestStream(portStream)
  }
}

function handleEthRpcRequestStream(stream){
  stream.on('data', onRpcRequest.bind(null, stream))
}

//
// state and network
//

var config = getConfig()
var idStore = new IdentityStore()
var zeroClient = MetaMaskProvider({
  rpcUrl: config.rpcTarget,
  getAccounts: function(cb){
    var selectedAddress = idStore.getSelectedAddress()
    var result = selectedAddress ? [selectedAddress] : []
    cb(null, result)
  },
  approveTransaction: addUnconfirmedTx,
  signTransaction: idStore.signTransaction.bind(idStore),
})

// log new blocks
zeroClient.on('block', function(block){
  console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
})

var ethStore = new EthStore(zeroClient)
idStore.setStore(ethStore)

function getState(){
  var state = extend(
    ethStore.getState(),
    idStore.getState(),
    getConfig()
  )
  return state
}

// handle rpc requests
function onRpcRequest(remoteStream, payload){
  // console.log('MetaMaskPlugin - incoming payload:', payload)
  zeroClient.sendAsync(payload, function onPayloadHandled(err, response){
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
// popup integration
//

function handleInternalCommunication(portStream){
  // setup multiplexing
  var mx = Multiplex()
  portStream.pipe(mx).pipe(portStream)
  mx.on('error', function(err) {
    console.error(err)
    // portStream.destroy()
  })
  portStream.on('error', function(err) {
    console.error(err)
    mx.destroy()
  })
  var dnodeStream = mx.createSharedStream('dnode')
  var providerStream = combineStreams(
    jsonStringifyStream(),
    mx.createSharedStream('provider'),
    jsonParseStream()
  )

  linkDnode(dnodeStream)
  handleEthRpcRequestStream(providerStream)
}

function linkDnode(stream){
  var connection = Dnode({
    getState:           function(cb){ cb(null, getState()) },
    setRpcTarget:       setRpcTarget,
    // forward directly to idStore
    createNewVault:     idStore.createNewVault.bind(idStore),
    submitPassword:     idStore.submitPassword.bind(idStore),
    setSelectedAddress: idStore.setSelectedAddress.bind(idStore),
    approveTransaction: idStore.approveTransaction.bind(idStore),
    cancelTransaction:  idStore.cancelTransaction.bind(idStore),
    setLocked:          idStore.setLocked.bind(idStore),
  })
  stream.pipe(connection).pipe(stream)
  connection.on('remote', function(remote){
    
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
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/images/icon-128.png',
    title: 'New Transaction',
    message: 'click the extension to confirm...',
  })
  idStore.addUnconfirmedTransaction(txParams, cb)
}

//
// config
//

// called from popup
function setRpcTarget(rpcTarget){
  var config = getConfig()
  config.rpcTarget = rpcTarget
  setConfig(config)
  chrome.runtime.reload()
}

function getConfig(){
  return extend({
    rpcTarget: 'https://rawtestrpc.metamask.io/',
  }, JSON.parse(localStorage['config'] || '{}'))
}

function setConfig(state){
  localStorage['config'] = JSON.stringify(state)
}

// util

function jsonParseStream(){
  return Through.obj(function(serialized){
    this.push(JSON.parse(serialized))
    cb()
  })
}

function jsonStringifyStream(){
  return Through.obj(function(obj){
    this.push(JSON.stringify(obj))
    cb()
  })
}