const EventEmitter = require('events').EventEmitter
const async = require('async')
const KeyStore = require('eth-lightwallet').keystore
const createPayload = require('web3-provider-engine/util/create-payload')
var selectedAddress = null
var identities = {}

module.exports = IdentityManager


var provider = null
var pubsub = new EventEmitter()

function IdentityManager(opts){
  opts = opts || {}
  providerEngine = opts.providerEngine

  return {
    // plugin popup
    getState: getState,
    subscribe: subscribe,
    submitPassword: submitPassword,
    setSelectedAddress: setSelectedAddress,
    signTransaction: signTransaction,
    setLocked: setLocked,
    // eth rpc
    getAccounts: getAccounts,
    confirmTransaction: confirmTransaction,
    // etc
    newBlock: newBlock,
    setProvider: setProvider,
  }
}

function setProvider(_provider){
  provider = _provider
}

function newBlock(block){
  pubsub.emit('block', block)
  updateIdentities()
}

// on new block, update our accounts (but only if we're unlocked)
function subscribe(cb){
  pubsub.on('block', sendUpdateState)
  function sendUpdateState(){
    if (!isUnlocked()) return
    updateIdentities(function(){
      var state = _getState()
      cb(state)
    })
  }
}

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
    // load identities before returning...
    loadIdentities()
    var state = _getState()
    cb(null, state)
    // trigger an update but dont wait for it
    updateIdentities()
  })
}

// get the current selected address
function getAccounts(cb){
  var result = selectedAddress ? [selectedAddress] : []
  console.log('getAccounts:', result)
  cb(null, result)
}

function getIdentities(){
  return identities
}

// load identities from keyStore
function loadIdentities(){
  if (!isUnlocked()) throw new Error('not unlocked')
  var keyStore = getKeyStore()
  var addresses = keyStore.getAddresses().map(function(address){ return '0x'+address })
  addresses.forEach(function(address){
    var identity = {
      name: 'Wally',
      img: 'QmW6hcwYzXrNkuHrpvo58YeZvbZxUddv69ATSHY3BHpPdd',
      address: address,
      balance: null,
      txCount: null,
    }
    identities[address] = identity
  })
}

// foreach in identities, update balance + nonce
function updateIdentities(cb){
  cb = cb || function(){}
  if (!isUnlocked()) return cb(new Error('Not unlocked.'))
  var addresses = Object.keys(identities)
  async.map(addresses, updateIdentity, cb)
}

// gets latest info from the network for the identity
function updateIdentity(address, cb){
  async.parallel([
    getAccountBalance.bind(null, address),
    getTxCount.bind(null, address),
  ], function(err, result){
    if (err) return cb(err)
    var identity = identities[address]
    identity.balance = result[0]
    identity.txCount = result[1]
    cb()
  })
}

function getTxCount(address, cb){
  provider.sendAsync(createPayload({
    method: 'eth_getTransactionCount',
    params: [address],
  }), function(err, res){
    if (err) return cb(err)
    if (res.error) return cb(res.error)
    cb(null, res.result)
  })
}

function getAccountBalance(address, cb){
  provider.sendAsync(createPayload({
    method: 'eth_getBalance',
    params: [address],
  }), function(err, res){
    if (err) return cb(err)
    if (res.error) return cb(res.error)
    cb(null, res.result)
  })
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