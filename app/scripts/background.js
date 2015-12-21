const ZeroClientProvider = require('web3-provider-engine')
// const PortStream = require('./lib/port-stream.js')
const identitiesUrl = 'https://alpha.metamask.io/identities/'

// var unsignedTxs = {}

var zeroClient = ZeroClientProvider()

// setup badge click handler
chrome.browserAction.onClicked.addListener(function(activeTab) {
  chrome.tabs.create({ url: identitiesUrl })
})

// setup messaging
chrome.runtime.onConnect.addListener(connectRemote)
// chrome.runtime.onConnectExternal.addListener(connectRemote)
function connectRemote(remotePort){
  remotePort.onMessage.addListener(onRpcRequest.bind(null, remotePort))
}

function onRpcRequest(remotePort, payload){
  zeroClient.sendAsync(payload, function onPayloadHandled(err, response){
    if (err) throw err
    console.log('MetaMaskPlugin - RPC complete:', payload, '->', response)
    if (response.result === true) debugger
    // if (typeof response !== 'object') {
    // if (!response) {
    //   console.warn('-------------------------------')
    //   console.warn(payload, '->', response)
    //   console.warn('-------------------------------')
    // }
    remotePort.postMessage(response)
  })
}

// // load from storage
// chrome.storage.sync.get(function(data){
//   for (var key in data) {
//     var serialized = data[key]
//     var tx = deserializeTx(serialized)
//     var hash = simpleHash(serialized)
//     unsignedTxs[hash] = tx
//   }
//   updateBadge()
// })

// // listen to storage changes
// chrome.storage.onChanged.addListener(function(changes, namespace) {
//   for (key in changes) {
//     var storageChange = changes[key]
//     if (storageChange.oldValue && !storageChange.newValue) {
//       // was removed
//       removeTransaction(storageChange.oldValue)
//     } else if (!storageChange.oldValue && storageChange.newValue) {
//       // was added
//       addTransaction(deserializeTx(storageChange.newValue))
//     }
//   }
// })

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

// function addTransaction(tx){
//   var serialized = serializeTx(tx)
//   var hash = simpleHash(serialized)
//   unsignedTxs[hash] = tx
//   var data = {}
//   data[hash] = serialized
//   chrome.storage.sync.set(data)
//   // trigger ui changes
//   updateBadge()
// }

// function removeTransaction(serialized){
//   var hash = simpleHash(serialized)
//   delete unsignedTxs[hash]
//   var data = {}
//   data[hash] = undefined
//   chrome.storage.sync.set(data)
//   // trigger ui changes
//   updateBadge()
// }

// function exportUnsignedTxs(remote){
//   console.log('exporting txs!', unsignedTxs)
//   var data = {
//     type: 'importUnsignedTxs',
//     payload: getValues(unsignedTxs),
//   }
//   remote.postMessage(data)
// }

// function simpleHash(input) {
//   var hash = 0, i, chr, len
//   if (input.length == 0) return hash
//   for (i = 0, len = input.length; i < len; i++) {
//     chr   = input.charCodeAt(i)
//     hash  = ((hash << 5) - hash) + chr
//     hash |= 0 // Convert to 32bit integer
//   }
//   return hash
// }

// function serializeTx(tx){
//   return JSON.stringify(tx)
// }

// function deserializeTx(tx){
//   return JSON.parse(tx)
// }

// function getValues(obj){
//   var output = []
//   for (var key in obj) {
//     output.push(obj[key])
//   }
//   return output
// }