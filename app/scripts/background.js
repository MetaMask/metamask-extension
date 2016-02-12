const Dnode = require('dnode')
const eos = require('end-of-stream')
const extend = require('xtend')
const EthStore = require('eth-store')
const PortStream = require('./lib/port-stream.js')
const MetaMaskProvider = require('./lib/metamask-provider')
// const IdentityManager = require('./lib/idmgmt')
const IdentityStore = require('./lib/idStore')

console.log('ready to roll')

//
// connect to other contexts
//

chrome.runtime.onConnect.addListener(connectRemote)
function connectRemote(remotePort){
  var isMetaMaskInternalProcess = (remotePort.name === 'popup')
  if (isMetaMaskInternalProcess) {
    // communication with popup
    handleInternalCommunication(remotePort)
  } else {
    // communication with page
    handleExternalCommunication(remotePort)
  }
}

function handleExternalCommunication(remotePort){
  remotePort.onMessage.addListener(onRpcRequest.bind(null, remotePort))
}

//
// state and network
//

var idStore = new IdentityStore()
var zeroClient = MetaMaskProvider({
  rpcUrl: 'https://rawtestrpc.metamask.io/',
  getAccounts: function(cb){
    var selectedAddress = idStore.getSelectedAddress()
    var result = selectedAddress ? [selectedAddress] : []
    cb(null, result)
  },
  signTransaction: idStore.addUnconfirmedTransaction.bind(idStore),
})
var ethStore = new EthStore(zeroClient)
idStore.setStore(ethStore)

function getState(){
  var state = extend(ethStore.getState(), idStore.getState())
  console.log(state)
  return state
}

// handle rpc requests
function onRpcRequest(remotePort, payload){
  // console.log('MetaMaskPlugin - incoming payload:', payload)
  zeroClient.sendAsync(payload, function onPayloadHandled(err, response){
    if (err) throw err
    // console.log('MetaMaskPlugin - RPC complete:', payload, '->', response)
    try {
      remotePort.postMessage(response)
    } catch (_) {
      // port disconnected
    }
  })
}


//
// popup integration
//

function handleInternalCommunication(remotePort){
  var duplex = new PortStream(remotePort)
  var connection = Dnode({
    getState:           function(cb){ cb(null, getState()) },
    // forward directly to idStore
    submitPassword:     idStore.submitPassword.bind(idStore),
    setSelectedAddress: idStore.setSelectedAddress.bind(idStore),
    signTransaction:    idStore.signTransaction.bind(idStore),
    cancelTransaction:  idStore.cancelTransaction.bind(idStore),
    setLocked:          idStore.setLocked.bind(idStore),
  })
  duplex.pipe(connection).pipe(duplex)
  connection.on('remote', function(remote){
    
    // push updates to popup
    ethStore.on('update', sendUpdate)
    idStore.on('update', sendUpdate)
    // teardown on disconnect
    eos(duplex, function unsubscribe(){
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
  chrome.browserAction.setBadgeText({text: label})
  chrome.browserAction.setBadgeBackgroundColor({color: '#506F8B'})
}

