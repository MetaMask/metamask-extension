const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const Transaction = require('ethereumjs-tx')
const LightwalletKeyStore = require('eth-lightwallet').keystore
const LightwalletSigner = require('eth-lightwallet').signing
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
  // lightwallet key store
  self._keyStore = null
  // lightwallet wrapper
  self._idmgmt = null

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

IdentityStore.prototype.createNewVault = function(password, entropy, cb){
  delete this._keyStore
  delete window.localStorage['lightwallet']
  this._createIdmgmt(password, null, entropy, (err) => {
    if (err) return cb(err)
    var seedWords = this._idmgmt.getSeed()
    this._cacheSeedWordsUntilConfirmed(seedWords)
    this._loadIdentities()
    this._didUpdate()
    cb(null, seedWords)
  })
}

IdentityStore.prototype.recoverFromSeed = function(password, seed, cb){
  const self = this
  self._createIdmgmt(password, seed, null, function(err){
    if (err) return cb(err)
    self._loadIdentities()
    self._didUpdate()
    cb()
  })
}

IdentityStore.prototype.setStore = function(store){
  const self = this
  self._ethStore = store
}

IdentityStore.prototype.clearSeedWordCache = function(cb) {
  delete window.localStorage['seedWords']
  cb()
}

IdentityStore.prototype.getState = function(){
  const self = this
  const cachedSeeds = window.localStorage['seedWords']
  return clone(extend(self._currentState, {
    isInitialized: !!window.localStorage['lightwallet'] && !cachedSeeds,
    isUnlocked: self._isUnlocked(),
    seedWords: cachedSeeds,
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

IdentityStore.prototype.setLocked = function(){
  const self = this
  delete self._keyStore
  delete self._idmgmt
}

IdentityStore.prototype.submitPassword = function(password, cb){
  const self = this
  self._tryPassword(password, function(err){
    if (err) return cb(err)
    // load identities before returning...
    self._loadIdentities()
    cb()
  })
}

// comes from dapp via zero-client hooked-wallet provider
IdentityStore.prototype.addUnconfirmedTransaction = function(txParams, cb){
  var self = this

  // create txData obj with parameters and meta data
  var time = (new Date()).getTime()
  var txId = createId()
  var txData = {
    id: txId,
    txParams: txParams,
    time: time,
    status: 'unconfirmed',
  }
  self._currentState.unconfTxs[txId] = txData
  console.log('addUnconfirmedTransaction:', txData)

  // keep the cb around for after approval (requires user interaction)
  self._unconfTxCbs[txId] = cb

  // signal update
  self._didUpdate()

  return txId
}

// comes from metamask ui
IdentityStore.prototype.approveTransaction = function(txId, cb){
  const self = this

  var txData = self._currentState.unconfTxs[txId]
  var txParams = txData.txParams
  var approvalCb = self._unconfTxCbs[txId] || noop

  // accept tx
  cb()
  approvalCb(null, true)
  // clean up
  delete self._currentState.unconfTxs[txId]
  delete self._unconfTxCbs[txId]
  self._didUpdate()
}

// comes from metamask ui
IdentityStore.prototype.cancelTransaction = function(txId){
  const self = this

  var txData = self._currentState.unconfTxs[txId]
  var approvalCb = self._unconfTxCbs[txId] || noop

  // reject tx
  approvalCb(null, false)
  // clean up
  delete self._currentState.unconfTxs[txId]
  delete self._unconfTxCbs[txId]
  self._didUpdate()
}

// performs the actual signing, no autofill of params
IdentityStore.prototype.signTransaction = function(txParams, cb){
  const self = this
  try {
    console.log('signing tx...', txParams)
    var rawTx = self._idmgmt.signTx(txParams)
    cb(null, rawTx)
  } catch (err) {
    cb(err)
  }
}

//
// private
//

IdentityStore.prototype._didUpdate = function(){
  const self = this
  self.emit('update', self.getState())
}

IdentityStore.prototype._isUnlocked = function(){
  const self = this
  var result = Boolean(self._keyStore) && Boolean(self._idmgmt)
  return result
}

IdentityStore.prototype._cacheSeedWordsUntilConfirmed = function(seedWords) {
  window.localStorage['seedWords'] = seedWords
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
  self._createIdmgmt(password, null, null, cb)
}

IdentityStore.prototype._createIdmgmt = function(password, seed, entropy, cb){
  var keyStore = null
  LightwalletKeyStore.deriveKeyFromPassword(password, (err, derivedKey) => {
    if (err) return cb(err)
    var serializedKeystore = window.localStorage['lightwallet']

    if (seed) {
      this._restoreFromSeed(keyStore, seed, derivedKey)

    // returning user, recovering from localStorage
    } else if (serializedKeystore) {
      keyStore = this._loadFromLocalStorage(serializedKeystore, derivedKey, cb)
      var isCorrect = keyStore.isDerivedKeyCorrect(derivedKey)
      if (!isCorrect) return cb(new Error('Lightwallet - password incorrect'))

   // first time here
    } else {
      keyStore = this._createFirstWallet(entropy, derivedKey)
    }

    this._keyStore = keyStore
    this._idmgmt = new IdManagement({
      keyStore: keyStore,
      derivedKey: derivedKey,
    })

    cb()
  })
}

IdentityStore.prototype._restoreFromSeed = function(keyStore, seed, derivedKey) {
  keyStore = new LightwalletKeyStore(seed, derivedKey)
  keyStore.generateNewAddress(derivedKey, 3)
  window.localStorage['lightwallet'] = keyStore.serialize()
  console.log('restored from seed. saved to keystore localStorage')
}

IdentityStore.prototype._loadFromLocalStorage = function(serializedKeystore, derivedKey) {
  return LightwalletKeyStore.deserialize(serializedKeystore)
}

IdentityStore.prototype._createFirstWallet = function(entropy, derivedKey) {
  var secretSeed = LightwalletKeyStore.generateRandomSeed(entropy)
  var keyStore = new LightwalletKeyStore(secretSeed, derivedKey)
  keyStore.generateNewAddress(derivedKey, 3)
  window.localStorage['lightwallet'] = keyStore.serialize()
  console.log('wallet generated. saved to keystore localStorage')
  return keyStore
}

function IdManagement( opts = { keyStore: null, derivedKey: null } ) {
  this.keyStore = opts.keyStore
  this.derivedKey = opts.derivedKey

  this.getAddresses =  function(){
    return keyStore.getAddresses().map(function(address){ return '0x'+address })
  }

  this.signTx = function(txParams){
    // normalize values
    txParams.to = ethUtil.addHexPrefix(txParams.to)
    txParams.from = ethUtil.addHexPrefix(txParams.from)
    txParams.value = ethUtil.addHexPrefix(txParams.value)
    txParams.data = ethUtil.addHexPrefix(txParams.data)
    txParams.gasLimit = ethUtil.addHexPrefix(txParams.gasLimit || txParams.gas)
    txParams.nonce = ethUtil.addHexPrefix(txParams.nonce)
    var tx = new Transaction(txParams)
    var rawTx = '0x'+tx.serialize().toString('hex')
    return '0x'+LightwalletSigner.signTx(this.keyStore, this.derivedKey, rawTx, txParams.from)
  }

  this.getSeed = function(){
    return this.keyStore.getSeed(this.derivedKey)
  }
}


// util

function noop(){}
