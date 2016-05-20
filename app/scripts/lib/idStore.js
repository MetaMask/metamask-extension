const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const Transaction = require('ethereumjs-tx')
const LightwalletKeyStore = require('eth-lightwallet').keystore
const LightwalletSigner = require('eth-lightwallet').signing
const async = require('async')
const clone = require('clone')
const extend = require('xtend')
const createId = require('web3-provider-engine/util/random-id')
const autoFaucet = require('./auto-faucet')
const configManager = require('./config-manager-singleton')
const messageManager = require('./message-manager')
const DEFAULT_RPC = 'https://testrpc.metamask.io/'


module.exports = IdentityStore


inherits(IdentityStore, EventEmitter)
function IdentityStore(opts = {}) {
  EventEmitter.call(this)

  // we just use the ethStore to auto-add accounts
  this._ethStore = opts.ethStore
  // lightwallet key store
  this._keyStore = null
  // lightwallet wrapper
  this._idmgmt = null

  this.hdPathString = "m/44'/60'/0'/0"

  this._currentState = {
    selectedAddress: null,
    identities: {},
  }

  // not part of serilized metamask state - only kept in memory
  this._unconfTxCbs = {}
  this._unconfMsgCbs = {}
}

//
// public
//

IdentityStore.prototype.createNewVault = function(password, entropy, cb){
  delete this._keyStore
  configManager.clearWallet()
  this._createIdmgmt(password, null, entropy, (err) => {
    if (err) return cb(err)

    this._loadIdentities()
    this._didUpdate()
    this._autoFaucet()

    configManager.setShowSeedWords(true)
    var seedWords = this._idmgmt.getSeed()
    cb(null, seedWords)
  })
}

IdentityStore.prototype.recoverFromSeed = function(password, seed, cb){
  this._createIdmgmt(password, seed, null, (err) => {
    if (err) return cb(err)

    this._loadIdentities()
    this._didUpdate()
    cb(null, this.getState())
  })
}

IdentityStore.prototype.setStore = function(store){
  this._ethStore = store
}

IdentityStore.prototype.clearSeedWordCache = function(cb) {
  configManager.setShowSeedWords(false)
  cb(null, configManager.getSelectedAccount())
}

IdentityStore.prototype.getState = function(){
  var seedWords = this.getSeedIfUnlocked()
  var wallet = configManager.getWallet()
  return clone(extend(this._currentState, {
    isInitialized: !!configManager.getWallet() && !seedWords,
    isUnlocked: this._isUnlocked(),
    seedWords: seedWords,
    unconfTxs: configManager.unconfirmedTxs(),
    transactions: configManager.getTxList(),
    unconfMsgs: messageManager.unconfirmedMsgs(),
    messages: messageManager.getMsgList(),
    selectedAddress: configManager.getSelectedAccount(),
  }))
}

IdentityStore.prototype.getSeedIfUnlocked = function() {
  var showSeed = configManager.getShouldShowSeedWords()
  var idmgmt = this._idmgmt
  var shouldShow = showSeed && !!idmgmt
  var seedWords = shouldShow ? idmgmt.getSeed() : null
  return seedWords
}

IdentityStore.prototype.getSelectedAddress = function(){
  return configManager.getSelectedAccount()
}

IdentityStore.prototype.setSelectedAddress = function(address, cb){
  if (!address) {
    var addresses = this._getAddresses()
    address = addresses[0]
  }

  configManager.setSelectedAccount(address)
  if (cb) return cb(null, address)
}

IdentityStore.prototype.revealAccount = function(cb) {
  let addresses = this._getAddresses()
  const derivedKey = this._idmgmt.derivedKey
  const keyStore = this._keyStore

  keyStore.setDefaultHdDerivationPath(this.hdPathString)
  keyStore.generateNewAddress(derivedKey, 1)
  configManager.setWallet(keyStore.serialize())

  addresses = this._getAddresses()
  this._loadIdentities()
  this._didUpdate()
  cb(null)
}

IdentityStore.prototype.getNetwork = function(tries) {
  if (tries === 0) return
  this.web3.version.getNetwork((err, network) => {
    if (err) {
      return this.getNetwork(tries - 1, cb)
    }
    this._currentState.network = network
  })
}

IdentityStore.prototype.setLocked = function(cb){
  delete this._keyStore
  delete this._idmgmt
  cb()
}

IdentityStore.prototype.submitPassword = function(password, cb){
  this._tryPassword(password, (err) => {
    if (err) return cb(err)
    // load identities before returning...
    this._loadIdentities()
    cb(null, configManager.getSelectedAccount())
  })
}

IdentityStore.prototype.exportAccount = function(address, cb) {
  var privateKey = this._idmgmt.exportPrivateKey(address)
  cb(null, privateKey)
}

//
// Transactions
//

// comes from dapp via zero-client hooked-wallet provider
IdentityStore.prototype.addUnconfirmedTransaction = function(txParams, cb){

  // create txData obj with parameters and meta data
  var time = (new Date()).getTime()
  var txId = createId()
  txParams.metamaskId = txId
  txParams.metamaskNetworkId = this._currentState.network
  var txData = {
    id: txId,
    txParams: txParams,
    time: time,
    status: 'unconfirmed',
  }
  configManager.addTx(txData)
  console.log('addUnconfirmedTransaction:', txData)

  // keep the cb around for after approval (requires user interaction)
  // This cb fires completion to the Dapp's write operation.
  this._unconfTxCbs[txId] = cb

  // signal update
  this._didUpdate()

  return txId
}

// comes from metamask ui
IdentityStore.prototype.approveTransaction = function(txId, cb){
  var txData = configManager.getTx(txId)
  var approvalCb = this._unconfTxCbs[txId] || noop

  // accept tx
  cb()
  approvalCb(null, true)
  // clean up
  configManager.confirmTx(txId)
  delete this._unconfTxCbs[txId]
  this._didUpdate()
}

// comes from metamask ui
IdentityStore.prototype.cancelTransaction = function(txId){
  var txData = configManager.getTx(txId)
  var approvalCb = this._unconfTxCbs[txId] || noop

  // reject tx
  approvalCb(null, false)
  // clean up
  configManager.rejectTx(txId)
  delete this._unconfTxCbs[txId]
  this._didUpdate()
}

// performs the actual signing, no autofill of params
IdentityStore.prototype.signTransaction = function(txParams, cb){
  try {
    console.log('signing tx...', txParams)
    var rawTx = this._idmgmt.signTx(txParams)
    cb(null, rawTx)
  } catch (err) {
    cb(err)
  }
}

//
// Messages
//

// comes from dapp via zero-client hooked-wallet provider
IdentityStore.prototype.addUnconfirmedMessage = function(msgParams, cb){

  // create txData obj with parameters and meta data
  var time = (new Date()).getTime()
  var msgId = createId()
  var msgData = {
    id: msgId,
    msgParams: msgParams,
    time: time,
    status: 'unconfirmed',
  }
  messageManager.addMsg(msgData)
  console.log('addUnconfirmedMessage:', msgData)

  // keep the cb around for after approval (requires user interaction)
  // This cb fires completion to the Dapp's write operation.
  this._unconfMsgCbs[msgId] = cb

  // signal update
  this._didUpdate()

  return msgId
}

// comes from metamask ui
IdentityStore.prototype.approveMessage = function(msgId, cb){
  var msgData = messageManager.getMsg(msgId)
  var approvalCb = this._unconfMsgCbs[msgId] || noop

  // accept msg
  cb()
  approvalCb(null, true)
  // clean up
  messageManager.confirmMsg(msgId)
  delete this._unconfMsgCbs[msgId]
  this._didUpdate()
}

// comes from metamask ui
IdentityStore.prototype.cancelMessage = function(msgId){
  var txData = messageManager.getMsg(msgId)
  var approvalCb = this._unconfMsgCbs[msgId] || noop

  // reject tx
  approvalCb(null, false)
  // clean up
  messageManager.rejectMsg(msgId)
  delete this._unconfTxCbs[msgId]
  this._didUpdate()
}

// performs the actual signing, no autofill of params
IdentityStore.prototype.signMessage = function(msgParams, cb){
  try {
    console.log('signing msg...', msgParams.data)
    var rawMsg = this._idmgmt.signMsg(msgParams.from, msgParams.data)
    if ('metamaskId' in msgParams) {
      var id = msgParams.metamaskId
      delete msgParams.metamaskId

      this.approveMessage(id, cb)
    } else {
      cb(null, rawMsg)
    }
  } catch (err) {
    cb(err)
  }
}

//
// private
//

IdentityStore.prototype._didUpdate = function(){
  this.emit('update', this.getState())
}

IdentityStore.prototype._isUnlocked = function(){
  var result = Boolean(this._keyStore) && Boolean(this._idmgmt)
  return result
}

// load identities from keyStoreet
IdentityStore.prototype._loadIdentities = function(){
  if (!this._isUnlocked()) throw new Error('not unlocked')

  var addresses = this._getAddresses()
  addresses.forEach((address, i) => {
    // // add to ethStore
    this._ethStore.addAccount(address)
    // add to identities
    const defaultLabel = 'Wallet ' + (i+1)
    const nickname = configManager.nicknameForWallet(address)
    var identity = {
      name: nickname || defaultLabel,
      address: address,
      mayBeFauceting: this._mayBeFauceting(i),
    }
    this._currentState.identities[address] = identity
  })
  this._didUpdate()
}

IdentityStore.prototype.saveAccountLabel = function(account, label, cb) {
  configManager.setNicknameForWallet(account, label)
  this._loadIdentities()
  cb(null, label)
  this._didUpdate()
}

// mayBeFauceting
// If on testnet, index 0 may be fauceting.
// The UI will have to check the balance to know.
// If there is no balance and it mayBeFauceting,
// then it is in fact fauceting.
IdentityStore.prototype._mayBeFauceting = function(i) {
  var config = configManager.getProvider()
  if (i === 0 &&
      config.type === 'rpc' &&
      config.rpcTarget === DEFAULT_RPC) {
    return true
  }
  return false
}

//
// keyStore managment - unlocking + deserialization
//

IdentityStore.prototype._tryPassword = function(password, cb){
  this._createIdmgmt(password, null, null, cb)
}

IdentityStore.prototype._createIdmgmt = function(password, seed, entropy, cb){
  var keyStore = null
  LightwalletKeyStore.deriveKeyFromPassword(password, (err, derivedKey) => {
    if (err) return cb(err)
    var serializedKeystore = configManager.getWallet()

    if (seed) {
      try {
        keyStore = this._restoreFromSeed(password, seed, derivedKey)
      } catch (e) {
        return cb(e)
      }

    // returning user, recovering from storage
    } else if (serializedKeystore) {
      keyStore = LightwalletKeyStore.deserialize(serializedKeystore)
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
      hdPathSTring: this.hdPathString,
    })

    cb()
  })
}

IdentityStore.prototype._restoreFromSeed = function(password, seed, derivedKey) {
  var keyStore = new LightwalletKeyStore(seed, derivedKey, this.hdPathString)
  keyStore.addHdDerivationPath(this.hdPathString, derivedKey, {curve: 'secp256k1', purpose: 'sign'});
  keyStore.setDefaultHdDerivationPath(this.hdPathString)

  keyStore.generateNewAddress(derivedKey, 3)
  configManager.setWallet(keyStore.serialize())
  console.log('restored from seed. saved to keystore')
  return keyStore
}

IdentityStore.prototype._createFirstWallet = function(entropy, derivedKey) {
  var secretSeed = LightwalletKeyStore.generateRandomSeed(entropy)
  var keyStore = new LightwalletKeyStore(secretSeed, derivedKey, this.hdPathString)
  keyStore.addHdDerivationPath(this.hdPathString, derivedKey, {curve: 'secp256k1', purpose: 'sign'});
  keyStore.setDefaultHdDerivationPath(this.hdPathString)

  keyStore.generateNewAddress(derivedKey, 3)
  configManager.setWallet(keyStore.serialize())
  console.log('saved to keystore')
  return keyStore
}

// get addresses and normalize address hexString
IdentityStore.prototype._getAddresses = function() {
  return this._keyStore.getAddresses(this.hdPathString).map((address) => { return '0x'+address })
}

IdentityStore.prototype._autoFaucet = function() {
  var addresses = this._getAddresses()
  autoFaucet(addresses[0])
}

function IdManagement(opts) {
  if (!opts) opts = {}

  this.keyStore = opts.keyStore
  this.derivedKey = opts.derivedKey
  this.hdPathString = "m/44'/60'/0'/0"

  this.getAddresses =  function(){
    return keyStore.getAddresses(this.hdPathString).map(function(address){ return '0x'+address })
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

    // sign tx
    var privKeyHex = this.exportPrivateKey(txParams.from)
    var privKey = ethUtil.toBuffer(privKeyHex)
    tx.sign(privKey)

    // Add the tx hash to the persisted meta-tx object
    var txHash = ethUtil.bufferToHex(tx.hash())
    var metaTx = configManager.getTx(txParams.metamaskId)
    metaTx.hash = txHash
    configManager.updateTx(metaTx)

    // return raw serialized tx
    var rawTx = ethUtil.bufferToHex(tx.serialize())
    return rawTx
  }

  this.signMsg = function(address, message){
    // sign message
    var privKeyHex = this.exportPrivateKey(address)
    var privKey = ethUtil.toBuffer(privKeyHex)
    var msgHash = ethUtil.sha3(message)
    var msgSig = ethUtil.ecsign(msgHash, privKey)
    var rawMsgSig = ethUtil.bufferToHex(concatSig(msgSig.v, msgSig.r, msgSig.s))
    return rawMsgSig
  }

  this.getSeed = function(){
    return this.keyStore.getSeed(this.derivedKey)
  }

  this.exportPrivateKey = function(address) {
    var privKeyHex = ethUtil.addHexPrefix(this.keyStore.exportPrivateKey(address, this.derivedKey, this.hdPathString))
    return privKeyHex
  }
}


// util

function noop(){}


function concatSig(v, r, s) {
  r = ethUtil.fromSigned(r)
  s = ethUtil.fromSigned(s)
  v = ethUtil.bufferToInt(v)
  r = ethUtil.toUnsigned(r).toString('hex')
  s = ethUtil.toUnsigned(s).toString('hex')
  v = ethUtil.stripHexPrefix(ethUtil.intToHex(v))
  return ethUtil.addHexPrefix(r.concat(s, v).toString("hex"))
}
