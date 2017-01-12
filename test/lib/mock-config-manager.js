const ConfigManager = require('../../app/scripts/lib/config-manager')
const ObservableStore = require('../../app/scripts/lib/observable/')
const STORAGE_KEY = 'metamask-config'
const extend = require('xtend')

module.exports = function() {
  let store = new ObservableStore(loadData())
  store.subscribe(setData)
  return new ConfigManager({ store })
}

function loadData () {
  var oldData = getOldStyleData()
  var newData

  try {
    newData = JSON.parse(window.localStorage[STORAGE_KEY])
  } catch (e) {}

  var data = extend({
    meta: {
      version: 0,
    },
    data: {
      config: {
        provider: {
          type: 'testnet',
        },
      },
    },
  }, oldData || null, newData || null)
  return data
}

function getOldStyleData () {
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

function setData (data) {
  window.localStorage[STORAGE_KEY] = JSON.stringify(data)
}
