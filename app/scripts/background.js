const Dnode = require('dnode')
const KeyStore = require('eth-lightwallet').keystore
const PortStream = require('./lib/port-stream.js')
const MetaMaskProvider = require('./lib/metamask-provider')

console.log('ready to roll')

// setup provider
var zeroClient = MetaMaskProvider({
  rpcUrl: 'https://testrpc.metamask.io/',
  getAccounts: getAccounts,
  sendTransaction: confirmTransaction,
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
  var remote = Dnode({
    getState: getState,
    setLocked: setLocked,
    submitPassword: submitPassword,
    setSelectedAddress: setSelectedAddress,
    signTransaction: signTransaction,
  })
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

// id mgmt
var selectedAddress = null

function getState(cb){
  var result = _getState()
  cb(null, result)
}

function _getState(cb){
  var unlocked = isUnlocked()
  var result = {
    isUnlocked: unlocked,
    identities: unlocked ? getIdentities() : {},
    selectedAddress: selectedAddress,
  }
  return result
}

function isUnlocked(){
  var password = window.sessionStorage['password']
  var result = Boolean(password)
  return result
}

function setLocked(){
  delete window.sessionStorage['password']
}

function setSelectedAddress(address, cb){
  selectedAddress = address
  cb(null, _getState())
}

function submitPassword(password, cb){
  console.log('submitPassword:', password)
  tryPassword(password, function(err){
    if (err) console.log('bad password:', password, err)
    if (err) return cb(err)
    console.log('good password:', password)
    window.sessionStorage['password'] = password
    cb(null, _getState())
  })
}

function getAccounts(cb){
  var identities = getIdentities()
  var result = selectedAddress ? [selectedAddress] : []
  cb(null, result)
}

function getIdentities(cb){
  var keyStore = getKeyStore()
  var addresses = keyStore.getAddresses()
  var accountStore = {}
  addresses.map(function(address){
    address = '0x'+address
    accountStore[address] = {
      name: 'Wally',
      img: 'QmW6hcwYzXrNkuHrpvo58YeZvbZxUddv69ATSHY3BHpPdd',
      address: address,
      balance: 10.005,
      txCount: 16,
    }
  })
  return accountStore
}

function tryPassword(password, cb){
  var keyStore = getKeyStore(password)
  var address = keyStore.getAddresses()[0]
  if (!address) return cb(new Error('KeyStore - No address to check.'))
  var hdPathString = keyStore.defaultHdPathString
  try {
    var encKey = keyStore.generateEncKey(password)
    var encPrivKey = keyStore.ksData[hdPathString].encPrivKeys[address]
    var privKey = KeyStore._decryptKey(encPrivKey, encKey)
    var addrFromPrivKey = KeyStore._computeAddressFromPrivKey(privKey)
  } catch (err) {
    return cb(err)
  }
  if (addrFromPrivKey !== address) return cb(new Error('KeyStore - Decrypting private key failed!'))
  cb()
}

function confirmTransaction(txParams, cb){
  console.log('confirmTransaction:', txParams)
}

function signTransaction(txParams, cb){
  console.log('signTransaction:', txParams)
}

var keyStore = null
function getKeyStore(password){
  if (keyStore) return keyStore
  password = password || getPassword()
  var serializedKeystore = window.localStorage['lightwallet']
  // returning user
  if (serializedKeystore) {
    keyStore = KeyStore.deserialize(serializedKeystore)
  // first time here
  } else {
    var defaultPassword = 'test'
    console.log('creating new keystore with default password:', defaultPassword)
    var secretSeed = KeyStore.generateRandomSeed()
    keyStore = new KeyStore(secretSeed, defaultPassword)
    keyStore.generateNewAddress(defaultPassword, 3)
    saveKeystore()
  }
  keyStore.passwordProvider = unlockKeystore
  return keyStore
}

function saveKeystore(){
  window.localStorage['lightwallet'] = keyStore.serialize()
}

function getPassword(){
  var password = window.sessionStorage['password']
  if (!password) throw new Error('No password found...')
}

function unlockKeystore(cb){
  var password = getPassword()
  console.warn('unlocking keystore...')
  cb(null, password)
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