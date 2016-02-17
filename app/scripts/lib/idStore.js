const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const Transaction = require('ethereumjs-tx')
const KeyStore = require('eth-lightwallet').keystore
const async = require('async')
const clone = require('clone')
const extend = require('xtend')
const createId = require('web3-provider-engine/util/random-id')


module.exports = IdentityStore


inherits(IdentityStore, EventEmitter)
function IdentityStore(ethStore) {
  const self = this
  EventEmitter.call(self)

  // we just use the ethStore to auto-add accounts
  self._ethStore = ethStore

  self._currentState = {
    selectedAddress: null,
    identities: {},
    unconfTxs: {},
  }
  // not part of serilized metamask state - only kept in memory
  self._unconfTxCbs = {}
}

//
// public
//

IdentityStore.prototype.createNewVault = function(password, cb){
  const self = this
  delete self._keyStore
  delete window.localStorage['lightwallet']
  var keyStore = self._getKeyStore(password)
  var seedWords = keyStore.getSeed(password)
  self._loadIdentities()
  self._didUpdate()
  cb(null, seedWords)
}


IdentityStore.prototype.setStore = function(store){
  const self = this
  self._ethStore = store
}


IdentityStore.prototype.getState = function(){
  const self = this
  return clone(extend(self._currentState, {
    isInitialized: !!window.localStorage['lightwallet'],
    isUnlocked: self._isUnlocked(),
  }))
}

IdentityStore.prototype.getSelectedAddress = function(){
  const self = this
  return self._currentState.selectedAddress
}

IdentityStore.prototype.setSelectedAddress = function(address){
  const self = this
  self._currentState.selectedAddress = address
  self._didUpdate()
}

IdentityStore.prototype.addUnconfirmedTransaction = function(txParams, cb){
  var self = this
  
  var time = (new Date()).getTime()
  var txId = createId()
  self._currentState.unconfTxs[txId] = {
    id: txId,
    txParams: txParams,
    time: time,
    status: 'unconfirmed',
  }
  console.log('addUnconfirmedTransaction:', txParams)
  
  // temp - just sign the tx
  // otherwise we need to keep the cb around
  // signTransaction(txId, cb)
  self._unconfTxCbs[txId] = cb

  // signal update
  self._didUpdate()
}



IdentityStore.prototype.setLocked = function(){
  const self = this
  delete self._keyStore
}

IdentityStore.prototype.submitPassword = function(password, cb){
  const self = this
  console.log('submitPassword:', password)
  self._tryPassword(password, function(err){
    if (err) console.log('bad password:', password, err)
    if (err) return cb(err)
    console.log('good password:', password)
    // load identities before returning...
    self._loadIdentities()
    cb()
  })
}

IdentityStore.prototype.signTransaction = function(password, txId, cb){
  const self = this

  var txData = self._currentState.unconfTxs[txId]
  var txParams = txData.txParams

  self._signTransaction(password, txParams, function(err, rawTx, txHash){
    if (err) {
      cb(err)
      txData.status = 'error'
      txData.error = err
      self._didUpdate()
      return
    }

    txData.rawTx = rawTx
    txData.hash = txHash
    txData.status = 'signed'

    // confirm tx signed
    cb()
    self._didUpdate()
  })
}

IdentityStore.prototype.sendTransaction = function(txId, cb){
  const self = this

  var txData = self._currentState.unconfTxs[txId]
  
  if (!txData || txData.status !== 'signed') {
    return cb(new Error('IdentityStore - Transaction not signed:', txId))
  }

  var rawTx = txData.rawTx

  // for now just remove it
  delete self._currentState.unconfTxs[txData.id]

  // rpc callback
  var txSigCb = self._unconfTxCbs[txId] || noop
  txSigCb(null, rawTx)

  // confirm tx sent
  cb()
  self._didUpdate()
}

IdentityStore.prototype.cancelTransaction = function(txId){
  const self = this

  var txData = self._currentState.unconfTxs[txId]
  delete self._currentState.unconfTxs[txId]
  self._didUpdate()  
}

//
// private
//

// internal - actually signs the tx
IdentityStore.prototype._signTransaction = function(password, txParams, cb){
  const self = this
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

    var serializedTx = self._keyStore.signTx(tx.serialize(), password, self._currentState.selectedAddress)

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

IdentityStore.prototype._didUpdate = function(){
  const self = this
  self.emit('update', self.getState())
}

IdentityStore.prototype._isUnlocked = function(){
  const self = this
  // var result = Boolean(password)
  var result = Boolean(self._keyStore)
  return result
}

// load identities from keyStoreet
IdentityStore.prototype._loadIdentities = function(){
  const self = this
  if (!self._isUnlocked()) throw new Error('not unlocked')
  // get addresses and normalize address hexString
  var addresses = self._keyStore.getAddresses().map(function(address){ return '0x'+address })
  addresses.forEach(function(address){
    // // add to ethStore
    self._ethStore.addAccount(address)
    // add to identities
    var identity = {
      name: 'Wally',
      img: 'QmW6hcwYzXrNkuHrpvo58YeZvbZxUddv69ATSHY3BHpPdd',
      address: address,
    }
    self._currentState.identities[address] = identity
  })
  self._didUpdate()
}

//
// keyStore managment - unlocking + deserialization
//

IdentityStore.prototype._tryPassword = function(password, cb){
  const self = this
  var keyStore = self._getKeyStore(password)
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

IdentityStore.prototype._getKeyStore = function(password){
  const self = this
  var keyStore = null
  var serializedKeystore = window.localStorage['lightwallet']
  // returning user
  if (serializedKeystore) {
    keyStore = KeyStore.deserialize(serializedKeystore)
  // first time here
  } else {
    console.log('creating new keystore with password:', password)
    var secretSeed = KeyStore.generateRandomSeed()
    keyStore = new KeyStore(secretSeed, password)
    keyStore.generateNewAddress(password, 3)
    self._saveKeystore(keyStore)
  }
  keyStore.passwordProvider = function getPassword(cb){
    cb(null, password)
  }
  self._keyStore = keyStore
  return keyStore
}

IdentityStore.prototype._saveKeystore = function(keyStore){
  const self = this
  window.localStorage['lightwallet'] = keyStore.serialize()
  console.log('saved to localStorage')
}

// util

function noop(){}