const ethUtil = require('ethereumjs-util')
const normalize = require('eth-sig-util').normalize
const MetamaskConfig = require('../config.js')


const MAINNET_RPC = MetamaskConfig.network.mainnet
// const ROPSTEN_RPC = MetamaskConfig.network.ropsten
// const KOVAN_RPC = MetamaskConfig.network.kovan
// const RINKEBY_RPC = MetamaskConfig.network.rinkeby

/* The config-manager is a convenience object
 * wrapping a pojo-migrator.
 *
 * It exists mostly to allow the creation of
 * convenience methods to access and persist
 * particular portions of the state.
 */
module.exports = ConfigManager
function ConfigManager (opts) {
  // ConfigManager is observable and will emit updates
  this._subs = []
  this.store = opts.store
}

ConfigManager.prototype.setConfig = function (config) {
  var data = this.getData()
  data.config = config
  this.setData(data)
  this._emitUpdates(config)
}

ConfigManager.prototype.getConfig = function () {
  var data = this.getData()
  return data.config
}

ConfigManager.prototype.setData = function (data) {
  this.store.putState(data)
}

ConfigManager.prototype.getData = function () {
  return this.store.getState()
}

ConfigManager.prototype.setPasswordForgotten = function (passwordForgottenState) {
  const data = this.getData()
  data.forgottenPassword = passwordForgottenState
  this.setData(data)
}

ConfigManager.prototype.getPasswordForgotten = function (passwordForgottenState) {
  const data = this.getData()
  return data.forgottenPassword
}

ConfigManager.prototype.setWallet = function (wallet) {
  var data = this.getData()
  data.wallet = wallet
  this.setData(data)
}

ConfigManager.prototype.setVault = function (encryptedString) {
  var data = this.getData()
  data.vault = encryptedString
  this.setData(data)
}

ConfigManager.prototype.getVault = function () {
  var data = this.getData()
  return data.vault
}

ConfigManager.prototype.getKeychains = function () {
  return this.getData().keychains || []
}

ConfigManager.prototype.setKeychains = function (keychains) {
  var data = this.getData()
  data.keychains = keychains
  this.setData(data)
}

ConfigManager.prototype.getSelectedAccount = function () {
  var config = this.getConfig()
  return config.selectedAccount
}

ConfigManager.prototype.setSelectedAccount = function (address) {
  var config = this.getConfig()
  config.selectedAccount = ethUtil.addHexPrefix(address)
  this.setConfig(config)
}

ConfigManager.prototype.getWallet = function () {
  return this.getData().wallet
}

// Takes a boolean
ConfigManager.prototype.setShowSeedWords = function (should) {
  var data = this.getData()
  data.showSeedWords = should
  this.setData(data)
}


ConfigManager.prototype.getShouldShowSeedWords = function () {
  var data = this.getData()
  return data.showSeedWords
}

ConfigManager.prototype.setSeedWords = function (words) {
  var data = this.getData()
  data.seedWords = words
  this.setData(data)
}

ConfigManager.prototype.getSeedWords = function () {
  var data = this.getData()
  return data.seedWords
}
ConfigManager.prototype.setRpcTarget = function (rpcUrl) {
  var config = this.getConfig()
  config.provider = {
    type: 'rpc',
    rpcTarget: rpcUrl,
  }
  this.setConfig(config)
}

ConfigManager.prototype.setProviderType = function (type) {
  var config = this.getConfig()
  config.provider = {
    type: type,
  }
  this.setConfig(config)
}

ConfigManager.prototype.useEtherscanProvider = function () {
  var config = this.getConfig()
  config.provider = {
    type: 'etherscan',
  }
  this.setConfig(config)
}

ConfigManager.prototype.getProvider = function () {
  var config = this.getConfig()
  return config.provider
}

ConfigManager.prototype.getCurrentRpcAddress = function () {
  var provider = this.getProvider()
  if (!provider) return null
  switch (provider.type) {

    case 'mainnet':
      return MAINNET_RPC

    // case 'ropsten':
    //   return ROPSTEN_RPC

    // case 'kovan':
    //   return KOVAN_RPC

    // case 'rinkeby':
    //   return RINKEBY_RPC

    default:
      return provider && provider.rpcTarget ? provider.rpcTarget : MAINNET_RPC
  }
}

//
// Tx
//

ConfigManager.prototype.getTxList = function () {
  var data = this.getData()
  if (data.transactions !== undefined) {
    return data.transactions
  } else {
    return []
  }
}

ConfigManager.prototype.setTxList = function (txList) {
  var data = this.getData()
  data.transactions = txList
  this.setData(data)
}


// wallet nickname methods

ConfigManager.prototype.getWalletNicknames = function () {
  var data = this.getData()
  const nicknames = ('walletNicknames' in data) ? data.walletNicknames : {}
  return nicknames
}

ConfigManager.prototype.nicknameForWallet = function (account) {
  const address = normalize(account)
  const nicknames = this.getWalletNicknames()
  return nicknames[address]
}

ConfigManager.prototype.setNicknameForWallet = function (account, nickname) {
  const address = normalize(account)
  const nicknames = this.getWalletNicknames()
  nicknames[address] = nickname
  var data = this.getData()
  data.walletNicknames = nicknames
  this.setData(data)
}

// observable

ConfigManager.prototype.getSalt = function () {
  var data = this.getData()
  return data.salt
}

ConfigManager.prototype.setSalt = function (salt) {
  var data = this.getData()
  data.salt = salt
  this.setData(data)
}

ConfigManager.prototype.subscribe = function (fn) {
  this._subs.push(fn)
  var unsubscribe = this.unsubscribe.bind(this, fn)
  return unsubscribe
}

ConfigManager.prototype.unsubscribe = function (fn) {
  var index = this._subs.indexOf(fn)
  if (index !== -1) this._subs.splice(index, 1)
}

ConfigManager.prototype._emitUpdates = function (state) {
  this._subs.forEach(function (handler) {
    handler(state)
  })
}

ConfigManager.prototype.setLostAccounts = function (lostAccounts) {
  var data = this.getData()
  data.lostAccounts = lostAccounts
  this.setData(data)
}

ConfigManager.prototype.getLostAccounts = function () {
  var data = this.getData()
  return data.lostAccounts || []
}
