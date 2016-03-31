const Migrator = require('pojo-migrator')
const extend = require('xtend')

const STORAGE_KEY = 'metamask-config'
var DEFAULT_RPC = 'https://rawtestrpc.metamask.io/'

/* The config-manager is a convenience object
 * wrapping a pojo-migrator.
 *
 * It exists mostly to allow the creation of
 * convenience methods to access and persist
 * particular portions of the state.
 */
module.exports = ConfigManager
function ConfigManager() {

  /* The migrator exported on the config-manager
   * has two methods the user should be concerned with:
   *
   * getData(), which returns the app-consumable data object
   * saveData(), which persists the app-consumable data object.
   */
  this.migrator =  new Migrator({

    // Migrations must start at version 1 or later.
    // They are objects with a `version` number
    // and a `migrate` function.
    //
    // The `migrate` function receives the previous
    // config data format, and returns the new one.
    migrations: [],

    // How to load initial config.
    // Includes step on migrating pre-pojo-migrator data.
    loadData: loadData,

    // How to persist migrated config.
    setData: function(data) {
      window.localStorage[STORAGE_KEY] = JSON.stringify(data)
    },
  })
}

ConfigManager.prototype.setConfig = function(config) {
  var data = this.migrator.getData()
  data.config = config
  this.setData(data)
}

ConfigManager.prototype.setRpcTarget = function(rpcUrl) {
  var config = this.getConfig()
  config.provider = {
    type: 'rpc',
    rpcTarget: rpcUrl,
  }
  this.setConfig(config)
}

ConfigManager.prototype.getConfig = function() {
  var data = this.migrator.getData()
  if ('config' in data) {
    return data.config
  } else {
    return {
      provider: {
        type: 'rpc',
        rpcTarget: DEFAULT_RPC,
      }
    }
  }
}

ConfigManager.prototype.setData = function(data) {
  this.migrator.saveData(data)
}

ConfigManager.prototype.getData = function() {
  return this.migrator.getData()
}

ConfigManager.prototype.setWallet = function(wallet) {
  var data = this.migrator.getData()
  data.wallet = wallet
  this.setData(data)
}

ConfigManager.prototype.getWallet = function() {
  return this.migrator.getData().wallet
}

ConfigManager.prototype.getSeedWords = function() {
  return this.migrator.getData().seedWords
}

ConfigManager.prototype.setSeedWords = function(seedWords) {
  var data = this.migrator.getData()
  data.seedWords = seedWords
  this.setData(data)
}

ConfigManager.prototype.clearSeedWords = function() {
  var data = this.migrator.getData()
  delete data.seedWords
  this.setData(data)
}

ConfigManager.prototype.getCurrentRpcAddress = function() {
  var config = this.getConfig()
  if (!config) return null
  return config.provider && config.provider.rpcTarget ? config.provider.rpcTarget : DEFAULT_RPC
}

ConfigManager.prototype.clearWallet = function() {
  var data = this.getConfig()
  delete data.wallet
  this.setData(data)
}

function loadData() {

  var oldData = getOldStyleData()
  var newData
  try {
    newData = JSON.parse(window.localStorage[STORAGE_KEY])
  } catch (e) {}

  var data = extend({
    version: 0,
    data: {
      config: {
        rpcTarget: DEFAULT_RPC,
      }
    }
  }, oldData ? oldData : null, newData ? newData : null)
  return data
}

function getOldStyleData() {
  var config, wallet, seedWords

  var result = {
    meta: { version: 0 },
    data: {},
  }

  try {
    config = JSON.parse(window.localStorage['config'])
    result.data.config = config
  } catch (e) {}
  try {
    wallet = JSON.parse(window.localStorage['lightwallet'])
    result.data.wallet = wallet
  } catch (e) {}
  try {
    seedWords = window.localStorage['seedWords']
    result.data.seedWords = seedWords
  } catch (e) {}

  return result
}

