const Dnode = require('dnode')
const PortStream = require('./lib/port-stream.js')
const MetaMaskProvider = require('./lib/metamask-provider')
const IdentityManager = require('./lib/idmgmt')
const eos = require('end-of-stream')

console.log('ready to roll')

var wallet = new IdentityManager()

// setup provider
var zeroClient = MetaMaskProvider({
  rpcUrl: 'https://rawtestrpc.metamask.io/',
  getAccounts: wallet.getAccounts.bind(wallet),
  signTransaction: wallet.addUnconfirmedTransaction.bind(wallet),
})

wallet.setProvider(zeroClient)
zeroClient.on('block', function(block){
  wallet.newBlock(block)
})


// setup messaging
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

function handleInternalCommunication(remotePort){
  var duplex = new PortStream(remotePort)
  var connection = Dnode({
    // this is annoying, have to decompose wallet
    getState:           wallet.getState.bind(wallet),
    submitPassword:     wallet.submitPassword.bind(wallet),
    setSelectedAddress: wallet.setSelectedAddress.bind(wallet),
    signTransaction:    wallet.signTransaction.bind(wallet),
    setLocked:          wallet.setLocked.bind(wallet),
    getAccounts:        wallet.getAccounts.bind(wallet),
    newBlock:           wallet.newBlock.bind(wallet),
    setProvider:        wallet.setProvider.bind(wallet),
  })
  duplex.pipe(connection).pipe(duplex)
  connection.on('remote', function(remote){
    
    // push updates to popup
    wallet.on('update', sendUpdate)
    eos(duplex, function unsubscribe(){
      wallet.removeListener('update', sendUpdate)
    })
    function sendUpdate(state){
      remote.sendUpdate(state)
    }

  })

  
    
  // sub to metamask store
}

function handleExternalCommunication(remotePort){
  remotePort.onMessage.addListener(onRpcRequest.bind(null, remotePort))
}

// handle rpc requests
function onRpcRequest(remotePort, payload){
  // console.log('MetaMaskPlugin - incoming payload:', payload)
  zeroClient.sendAsync(payload, function onPayloadHandled(err, response){
    if (err) throw err
    // console.log('MetaMaskPlugin - RPC complete:', payload, '->', response)
    remotePort.postMessage(response)
  })
}

// setup badge text
wallet.on('update', updateBadge)

function updateBadge(state){
  var label = ''
  var count = Object.keys(state.unconfTxs).length
  if (count) {
    label = String(count)
  }
  chrome.browserAction.setBadgeText({text: label})
  chrome.browserAction.setBadgeBackgroundColor({color: '#506F8B'})
}

// function handleMessage(msg){
//   console.log('got message!', msg.type)
//   switch(msg.type){
    
//     case 'addUnsignedTx':
//       addTransaction(msg.payload)
//       return

//     case 'removeUnsignedTx':
//       removeTransaction(msg.payload)
//       return

//   }
// }
