const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const async = require('async')
const KeyStore = require('eth-lightwallet').keystore
const createPayload = require('web3-provider-engine/util/create-payload')
const createId = require('web3-provider-engine/util/random-id')
const Transaction = require('ethereumjs-tx')

module.exports = IdentityManager


var selectedAddress = null
var identities = {}
var unconfTxs = {}

// not part of serilized metamask state - only keep in memory
var unconfTxCbs = {}

var provider = null
var defaultPassword = 'test'



inherits(IdentityManager, EventEmitter)
function IdentityManager(opts){
  const self = this
  self.on('block', function(){
    self.updateIdentities()
  })
}

// plugin popup
IdentityManager.prototype.getState = getState
IdentityManager.prototype.submitPassword = submitPassword
IdentityManager.prototype.setSelectedAddress = setSelectedAddress
IdentityManager.prototype.signTransaction = signTransaction
IdentityManager.prototype.setLocked = setLocked
// eth rpc
IdentityManager.prototype.getAccounts = getAccounts
IdentityManager.prototype.addUnconfirmedTransaction = addUnconfirmedTransaction
// etc
IdentityManager.prototype.newBlock = newBlock
IdentityManager.prototype.setProvider = setProvider



function setProvider(_provider){
  provider = _provider
}

function newBlock(block){
  var self = this
  self.emit('block', block)
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
    unconfTxs: unlocked ? unconfTxs : {},
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
  const self = this
  console.log('submitPassword:', password)
  tryPassword(password, function(err){
    if (err) console.log('bad password:', password, err)
    if (err) return cb(err)
    console.log('good password:', password)
    window.sessionStorage['password'] = password
    // load identities before returning...
    self.loadIdentities()
    var state = _getState()
    cb(null, state)
    // trigger an update but dont wait for it
    self.updateIdentities()
  })
}

// get the current selected address
function getAccounts(cb){
  var result = selectedAddress ? [selectedAddress] : []
  cb(null, result)
}

function getIdentities(){
  return identities
}

// load identities from keyStore
IdentityManager.prototype.loadIdentities = function(){
  const self = this
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
  self._didUpdate()
}

IdentityManager.prototype._didUpdate = function(){
  const self = this
  self.emit('update', _getState())
}

// foreach in identities, update balance + nonce
IdentityManager.prototype.updateIdentities = function(cb){
  var self = this
  cb = cb || function(){}
  if (!isUnlocked()) return cb(new Error('Not unlocked.'))
  var addresses = Object.keys(identities)
  async.map(addresses, self.updateIdentity.bind(self), cb)
}

// gets latest info from the network for the identity
IdentityManager.prototype.updateIdentity = function(address, cb){
  var self = this
  async.parallel([
    getAccountBalance.bind(null, address),
    getTxCount.bind(null, address),
  ], function(err, result){
    if (err) return cb(err)
    var identity = identities[address]
    identity.balance = result[0]
    identity.txCount = result[1]
    self._didUpdate()
    cb()
  })
}

function getTxCount(address, cb){
  provider.sendAsync(createPayload({
    method: 'eth_getTransactionCount',
    params: [address, 'pending'],
  }), function(err, res){
    if (err) return cb(err)
    if (res.error) return cb(res.error)
    cb(null, res.result)
  })
}

function getAccountBalance(address, cb){
  provider.sendAsync(createPayload({
    method: 'eth_getBalance',
    params: [address, 'latest'],
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

function addUnconfirmedTransaction(txParams, cb){
  var self = this
  
  var time = (new Date()).getTime()
  var txId = createId()
  unconfTxs[txId] = {
    id: txId,
    txParams: txParams,
    time: time,
    status: 'unconfirmed',
  }
  console.log('addUnconfirmedTransaction:', txParams)
  
  // temp - just sign the tx
  // otherwise we need to keep the cb around
  // signTransaction(txId, cb)
  unconfTxCbs[txId] = cb

  // signal update
  self._didUpdate()
}

// called from 
function signTransaction(password, txId, cb){
  const self = this

  var txData = unconfTxs[txId]
  var txParams = txData.txParams
  console.log('signTransaction:', txData)

  self._signTransaction(txParams, function(err, rawTx, txHash){
    if (err) {
      txData.status = 'error'
      txData.error = err
      self._didUpdate()
      return
    }
    txData.hash = txHash
    txData.status = 'pending'
    // for now just kill it
    delete unconfTxs[txData.id]
    
    var txSigCb = unconfTxCbs[txId] || function(){}
    txSigCb(null, rawTx)

    cb(null, _getState())
    self._didUpdate()
  })
}

// internal - actually signs the tx
IdentityManager.prototype._signTransaction = function(txParams, cb){
  try {
    // console.log('signing tx:', txParams)
    var tx = new Transaction({
      nonce: txParams.nonce,
      to: txParams.to,
      value: txParams.value,
      data: txParams.input,
      gasPrice: txParams.gasPrice,
      gasLimit: txParams.gas,
    })

    var keyStore = getKeyStore()
    var serializedTx = keyStore.signTx(tx.serialize(), defaultPassword, selectedAddress)

    // // deserialize and dump values to confirm configuration
    // var verifyTx = new Transaction(tx.serialize())
    // console.log('signed transaction:', {
    //   to: '0x'+verifyTx.to.toString('hex'),
    //   from: '0x'+verifyTx.from.toString('hex'),
    //   nonce: '0x'+verifyTx.nonce.toString('hex'),
    //   value: (ethUtil.bufferToInt(verifyTx.value)/1e18)+' ether',
    //   data: '0x'+verifyTx.data.toString('hex'),
    //   gasPrice: '0x'+verifyTx.gasPrice.toString('hex'),
    //   gasLimit: '0x'+verifyTx.gasLimit.toString('hex'),
    // })
    cb(null, serializedTx, tx.hash())
  } catch (err) {
    cb(err)
  }
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