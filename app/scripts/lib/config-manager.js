const Migrator = require('pojo-migrator')
const MetamaskConfig = require('../config.js')
const migrations = require('./migrations')
const rp = require('request-promise')
const ethUtil = require('ethereumjs-util')
const normalize = require('./sig-util').normalize

const TESTNET_RPC = MetamaskConfig.network.testnet
const MAINNET_RPC = MetamaskConfig.network.mainnet
const MORDEN_RPC = MetamaskConfig.network.morden
const txLimit = 40

/* The config-manager is a convenience object
 * wrapping a pojo-migrator.
 *
 * It exists mostly to allow the creation of
 * convenience methods to access and persist
 * particular portions of the state.
 */
module.exports = ConfigManager
function ConfigManager (opts) {
  this.txLimit = txLimit

  // ConfigManager is observable and will emit updates
  this._subs = []

  /* The migrator exported on the config-manager
   * has two methods the user should be concerned with:
   *
   * getData(), which returns the app-consumable data object
   * saveData(), which persists the app-consumable data object.
   */
  this.migrator = new Migrator({

    // Migrations must start at version 1 or later.
    // They are objects with a `version` number
    // and a `migrate` function.
    //
    // The `migrate` function receives the previous
    // config data format, and returns the new one.
    migrations: migrations,

    // How to load initial config.
    // Includes step on migrating pre-pojo-migrator data.
    loadData: opts.loadData,

    // How to persist migrated config.
    setData: opts.setData,
  })
}

ConfigManager.prototype.setConfig = function (config) {
  var data = this.migrator.getData()
  data.config = config
  this.setData(data)
  this._emitUpdates(config)
}

ConfigManager.prototype.getConfig = function () {
  var data = this.migrator.getData()
  if ('config' in data) {
    return data.config
  } else {
    return {
      provider: {
        type: 'testnet',
      },
    }
  }
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

ConfigManager.prototype.setData = function (data) {
  this.migrator.saveData(data)
}

ConfigManager.prototype.getData = function () {
  return this.migrator.getData()
}

ConfigManager.prototype.setWallet = function (wallet) {
  var data = this.migrator.getData()
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
  return this.migrator.getData().keychains || []
}

ConfigManager.prototype.setKeychains = function (keychains) {
  var data = this.migrator.getData()
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
  return this.migrator.getData().wallet
}

// Takes a boolean
ConfigManager.prototype.setShowSeedWords = function (should) {
  var data = this.migrator.getData()
  data.showSeedWords = should
  this.setData(data)
}


ConfigManager.prototype.getShouldShowSeedWords = function () {
  var data = this.migrator.getData()
  return data.showSeedWords
}

ConfigManager.prototype.setSeedWords = function (words) {
  var data = this.getData()
  data.seedWords = words
  this.setData(data)
}

ConfigManager.prototype.getSeedWords = function () {
  var data = this.getData()
  return ('seedWords' in data) && data.seedWords
}

ConfigManager.prototype.getCurrentRpcAddress = function () {
  var provider = this.getProvider()
  if (!provider) return null
  switch (provider.type) {

    case 'mainnet':
      return MAINNET_RPC

    case 'testnet':
      return TESTNET_RPC

    case 'morden':
      return MORDEN_RPC

    default:
      return provider && provider.rpcTarget ? provider.rpcTarget : TESTNET_RPC
  }
}

ConfigManager.prototype.setData = function (data) {
  this.migrator.saveData(data)
}

//
// Tx
//

ConfigManager.prototype.getTxList = function () {
  var data = this.migrator.getData()
  if (data.transactions !== undefined) {
    return data.transactions
  } else {
    return []
  }
}

ConfigManager.prototype.unconfirmedTxs = function () {
  var transactions = this.getTxList()
  return transactions.filter(tx => tx.status === 'unconfirmed')
  .reduce((result, tx) => { result[tx.id] = tx; return result }, {})
}

ConfigManager.prototype._saveTxList = function (txList) {
  var data = this.migrator.getData()
  data.transactions = txList
  this.setData(data)
}

ConfigManager.prototype.addTx = function (tx) {
  var transactions = this.getTxList()
  while (transactions.length > this.txLimit - 1) {
    transactions.shift()
  }
  transactions.push(tx)
  this._saveTxList(transactions)
}

ConfigManager.prototype.getTx = function (txId) {
  var transactions = this.getTxList()
  var matching = transactions.filter(tx => tx.id === txId)
  return matching.length > 0 ? matching[0] : null
}

ConfigManager.prototype.confirmTx = function (txId) {
  this._setTxStatus(txId, 'confirmed')
}

ConfigManager.prototype.rejectTx = function (txId) {
  this._setTxStatus(txId, 'rejected')
}

ConfigManager.prototype._setTxStatus = function (txId, status) {
  var tx = this.getTx(txId)
  tx.status = status
  this.updateTx(tx)
}

ConfigManager.prototype.updateTx = function (tx) {
  var transactions = this.getTxList()
  var found, index
  transactions.forEach((otherTx, i) => {
    if (otherTx.id === tx.id) {
      found = true
      index = i
    }
  })
  if (found) {
    transactions[index] = tx
  }
  this._saveTxList(transactions)
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
  return ('salt' in data) && data.salt
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

ConfigManager.prototype.setConfirmedDisclaimer = function (confirmed) {
  var data = this.getData()
  data.isDisclaimerConfirmed = confirmed
  this.setData(data)
}

ConfigManager.prototype.getConfirmedDisclaimer = function () {
  var data = this.getData()
  return ('isDisclaimerConfirmed' in data) && data.isDisclaimerConfirmed
}

ConfigManager.prototype.setTOSHash = function (hash) {
  var data = this.getData()
  data.TOSHash = hash
  this.setData(data)
}

ConfigManager.prototype.getTOSHash = function () {
  var data = this.getData()
  return ('TOSHash' in data) && data.TOSHash
}

ConfigManager.prototype.setCurrentFiat = function (currency) {
  var data = this.getData()
  data.fiatCurrency = currency
  this.setData(data)
}

ConfigManager.prototype.getCurrentFiat = function () {
  var data = this.getData()
  return ('fiatCurrency' in data) && data.fiatCurrency
}

ConfigManager.prototype.updateConversionRate = function () {
  var data = this.getData()
  return rp(`https://www.cryptonator.com/api/ticker/eth-${data.fiatCurrency}`)
  .then((response) => {
    const parsedResponse = JSON.parse(response)
    this.setConversionPrice(parsedResponse.ticker.price)
    this.setConversionDate(parsedResponse.timestamp)
  }).catch((err) => {
    console.error('Error in conversion.', err)
    this.setConversionPrice(0)
    this.setConversionDate('N/A')
  })
}

ConfigManager.prototype.setConversionPrice = function (price) {
  var data = this.getData()
  data.conversionRate = Number(price)
  this.setData(data)
}

ConfigManager.prototype.setConversionDate = function (datestring) {
  var data = this.getData()
  data.conversionDate = datestring
  this.setData(data)
}

ConfigManager.prototype.getConversionRate = function () {
  var data = this.getData()
  return (('conversionRate' in data) && data.conversionRate) || 0
}

ConfigManager.prototype.getConversionDate = function () {
  var data = this.getData()
  return (('conversionDate' in data) && data.conversionDate) || 'N/A'
}

ConfigManager.prototype.getShapeShiftTxList = function () {
  var data = this.getData()
  var shapeShiftTxList = data.shapeShiftTxList ? data.shapeShiftTxList : []
  shapeShiftTxList.forEach((tx) => {
    if (tx.response.status !== 'complete') {
      var requestListner = function (request) {
        tx.response = JSON.parse(this.responseText)
        if (tx.response.status === 'complete') {
          tx.time = new Date().getTime()
        }
      }

      var shapShiftReq = new XMLHttpRequest()
      shapShiftReq.addEventListener('load', requestListner)
      shapShiftReq.open('GET', `https://shapeshift.io/txStat/${tx.depositAddress}`, true)
      shapShiftReq.send()
    }
  })
  this.setData(data)
  return shapeShiftTxList
}

ConfigManager.prototype.createShapeShiftTx = function (depositAddress, depositType) {
  var data = this.getData()

  var shapeShiftTx = {depositAddress, depositType, key: 'shapeshift', time: new Date().getTime(), response: {}}
  if (!data.shapeShiftTxList) {
    data.shapeShiftTxList = [shapeShiftTx]
  } else {
    data.shapeShiftTxList.push(shapeShiftTx)
  }
  this.setData(data)
}

ConfigManager.prototype.getGasMultiplier = function () {
  var data = this.getData()
  return ('gasMultiplier' in data) && data.gasMultiplier
}

ConfigManager.prototype.setGasMultiplier = function (gasMultiplier) {
  var data = this.getData()

  data.gasMultiplier = gasMultiplier
  this.setData(data)
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
