const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const KeyStore = require('eth-lightwallet').keystore
const clone = require('clone')
const extend = require('xtend')
const autoFaucet = require('./auto-faucet')
const DEFAULT_RPC = 'https://testrpc.metamask.io/'
const IdManagement = require('./id-management')


module.exports = IdentityStore

inherits(IdentityStore, EventEmitter)
function IdentityStore (opts = {}) {
  EventEmitter.call(this)

  // we just use the ethStore to auto-add accounts
  this._ethStore = opts.ethStore
  this.configManager = opts.configManager
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
}

//
// public
//

IdentityStore.prototype.createNewVault = function (password, cb) {
  delete this._keyStore
  var serializedKeystore = this.configManager.getWallet()

  if (serializedKeystore) {
    this.configManager.setData({})
  }

  this.purgeCache()
  this._createVault(password, null, (err) => {
    if (err) return cb(err)

    this._autoFaucet()

    this.configManager.setShowSeedWords(true)
    var seedWords = this._idmgmt.getSeed()

    this._loadIdentities()

    cb(null, seedWords)
  })
}

IdentityStore.prototype.recoverSeed = function (cb) {
  this.configManager.setShowSeedWords(true)
  if (!this._idmgmt) return cb(new Error('Unauthenticated. Please sign in.'))
  var seedWords = this._idmgmt.getSeed()
  cb(null, seedWords)
}

IdentityStore.prototype.recoverFromSeed = function (password, seed, cb) {
  this.purgeCache()

  this._createVault(password, seed, (err) => {
    if (err) return cb(err)

    this._loadIdentities()
    cb(null, this.getState())
  })
}

IdentityStore.prototype.setStore = function (store) {
  this._ethStore = store
}

IdentityStore.prototype.clearSeedWordCache = function (cb) {
  const configManager = this.configManager
  configManager.setShowSeedWords(false)
  cb(null, configManager.getSelectedAccount())
}

IdentityStore.prototype.getState = function () {
  const configManager = this.configManager
  var seedWords = this.getSeedIfUnlocked()
  return clone(extend(this._currentState, {
    isInitialized: !!configManager.getWallet() && !seedWords,
    isUnlocked: this._isUnlocked(),
    seedWords: seedWords,
    isDisclaimerConfirmed: configManager.getConfirmedDisclaimer(),
    selectedAddress: configManager.getSelectedAccount(),
    gasMultiplier: configManager.getGasMultiplier(),
  }))
}

IdentityStore.prototype.getSeedIfUnlocked = function () {
  const configManager = this.configManager
  var showSeed = configManager.getShouldShowSeedWords()
  var idmgmt = this._idmgmt
  var shouldShow = showSeed && !!idmgmt
  var seedWords = shouldShow ? idmgmt.getSeed() : null
  return seedWords
}

IdentityStore.prototype.getSelectedAddress = function () {
  const configManager = this.configManager
  return configManager.getSelectedAccount()
}

IdentityStore.prototype.setSelectedAddressSync = function (address) {
  const configManager = this.configManager
  if (!address) {
    var addresses = this._getAddresses()
    address = addresses[0]
  }

  configManager.setSelectedAccount(address)
  return address
}

IdentityStore.prototype.setSelectedAddress = function (address, cb) {
  const resultAddress = this.setSelectedAddressSync(address)
  if (cb) return cb(null, resultAddress)
}

IdentityStore.prototype.revealAccount = function (cb) {
  const derivedKey = this._idmgmt.derivedKey
  const keyStore = this._keyStore
  const configManager = this.configManager

  keyStore.setDefaultHdDerivationPath(this.hdPathString)
  keyStore.generateNewAddress(derivedKey, 1)
  const addresses = keyStore.getAddresses()
  const address = addresses[ addresses.length - 1 ]

  this._ethStore.addAccount(ethUtil.addHexPrefix(address))

  configManager.setWallet(keyStore.serialize())

  this._loadIdentities()
  this._didUpdate()
  cb(null)
}

IdentityStore.prototype.getNetwork = function (err) {
  if (err) {
    this._currentState.network = 'loading'
    this._didUpdate()
  }

  this.web3.version.getNetwork((err, network) => {
    if (err) {
      this._currentState.network = 'loading'
      return this._didUpdate()
    }
    if (global.METAMASK_DEBUG) {
      console.log('web3.getNetwork returned ' + network)
    }
    this._currentState.network = network
    this._didUpdate()
  })
}

IdentityStore.prototype.setLocked = function (cb) {
  delete this._keyStore
  delete this._idmgmt
  cb()
}

IdentityStore.prototype.submitPassword = function (password, cb) {
  const configManager = this.configManager
  this.tryPassword(password, (err) => {
    if (err) return cb(err)
    // load identities before returning...
    this._loadIdentities()
    cb(null, configManager.getSelectedAccount())
  })
}

IdentityStore.prototype.exportAccount = function (address, cb) {
  var privateKey = this._idmgmt.exportPrivateKey(address)
  if (cb) cb(null, privateKey)
  return privateKey
}

// private
//

IdentityStore.prototype._didUpdate = function () {
  this.emit('update', this.getState())
}

IdentityStore.prototype._isUnlocked = function () {
  var result = Boolean(this._keyStore) && Boolean(this._idmgmt)
  return result
}

// load identities from keyStoreet
IdentityStore.prototype._loadIdentities = function () {
  const configManager = this.configManager
  if (!this._isUnlocked()) throw new Error('not unlocked')

  var addresses = this._getAddresses()
  addresses.forEach((address, i) => {
    // // add to ethStore
    if (this._ethStore) {
      this._ethStore.addAccount(ethUtil.addHexPrefix(address))
    }
    // add to identities
    const defaultLabel = 'Account ' + (i + 1)
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

IdentityStore.prototype.saveAccountLabel = function (account, label, cb) {
  const configManager = this.configManager
  configManager.setNicknameForWallet(account, label)
  this._loadIdentities()
  cb(null, label)
}

// mayBeFauceting
// If on testnet, index 0 may be fauceting.
// The UI will have to check the balance to know.
// If there is no balance and it mayBeFauceting,
// then it is in fact fauceting.
IdentityStore.prototype._mayBeFauceting = function (i) {
  const configManager = this.configManager
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

IdentityStore.prototype.tryPassword = function (password, cb) {
  var serializedKeystore = this.configManager.getWallet()
  var keyStore = KeyStore.deserialize(serializedKeystore)

  keyStore.keyFromPassword(password, (err, pwDerivedKey) => {
    if (err) return cb(err)

    const isCorrect = keyStore.isDerivedKeyCorrect(pwDerivedKey)
    if (!isCorrect) return cb(new Error('Lightwallet - password incorrect'))

    this._keyStore = keyStore
    this._createIdMgmt(pwDerivedKey)
    cb()
  })
}

IdentityStore.prototype._createVault = function (password, seedPhrase, cb) {
  const opts = {
    password,
    hdPathString: this.hdPathString,
  }

  if (seedPhrase) {
    opts.seedPhrase = seedPhrase
  }

  KeyStore.createVault(opts, (err, keyStore) => {
    if (err) return cb(err)

    this._keyStore = keyStore

    keyStore.keyFromPassword(password, (err, derivedKey) => {
      if (err) return cb(err)

      this.purgeCache()

      keyStore.addHdDerivationPath(this.hdPathString, derivedKey, {curve: 'secp256k1', purpose: 'sign'})

      this._createFirstWallet(derivedKey)
      this._createIdMgmt(derivedKey)
      this.setSelectedAddressSync()

      cb()
    })
  })
}

IdentityStore.prototype._createIdMgmt = function (derivedKey) {
  this._idmgmt = new IdManagement({
    keyStore: this._keyStore,
    derivedKey: derivedKey,
    configManager: this.configManager,
  })
}

IdentityStore.prototype.purgeCache = function () {
  this._currentState.identities = {}
  let accounts
  try {
    accounts = Object.keys(this._ethStore._currentState.accounts)
  } catch (e) {
    accounts = []
  }
  accounts.forEach((address) => {
    this._ethStore.removeAccount(address)
  })
}

IdentityStore.prototype._createFirstWallet = function (derivedKey) {
  const keyStore = this._keyStore
  keyStore.setDefaultHdDerivationPath(this.hdPathString)
  keyStore.generateNewAddress(derivedKey, 1)
  this.configManager.setWallet(keyStore.serialize())
  var addresses = keyStore.getAddresses()
  this._ethStore.addAccount(ethUtil.addHexPrefix(addresses[0]))
}

// get addresses and normalize address hexString
IdentityStore.prototype._getAddresses = function () {
  return this._keyStore.getAddresses(this.hdPathString).map((address) => {
    return ethUtil.addHexPrefix(address)
  })
}

IdentityStore.prototype._autoFaucet = function () {
  var addresses = this._getAddresses()
  autoFaucet(addresses[0])
}

// util

