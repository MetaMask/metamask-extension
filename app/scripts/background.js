const Dnode = require('dnode')
const PortStream = require('./lib/port-stream.js')
const MetaMaskProvider = require('./lib/metamask-provider')
const IdentityManager = require('./lib/idmgmt')

console.log('ready to roll')

var wallet = IdentityManager()

// setup provider
var zeroClient = MetaMaskProvider({
  rpcUrl: 'https://rawtestrpc.metamask.io/',
  getAccounts: wallet.getAccounts.bind(wallet),
  sendTransaction: wallet.confirmTransaction.bind(wallet),
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
  var remote = Dnode(wallet)
  duplex.pipe(remote).pipe(duplex)
}

function handleExternalCommunication(remotePort){
  remotePort.onMessage.addListener(onRpcRequest.bind(null, remotePort))
}

// handle rpc requests
function onRpcRequest(remotePort, payload){
  // console.log('MetaMaskPlugin - incoming payload:', payload)
  zeroClient.sendAsync(payload, function onPayloadHandled(err, response){
    if (err) throw err
    console.log('MetaMaskPlugin - RPC complete:', payload, '->', response)
    remotePort.postMessage(response)
  })
}

// setup badge text
// updateBadge()

// function updateBadge(){
//   var label = ''
//   var count = Object.keys(unsignedTxs).length
//   if (count) {
//     label = String(count)
//   }
//   chrome.browserAction.setBadgeText({text: label})
//   chrome.browserAction.setBadgeBackgroundColor({color: '#506F8B'})
// }

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
