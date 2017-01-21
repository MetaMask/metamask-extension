var assert = require('assert')
var MetaMaskController = require('../../app/scripts/metamask-controller')
var sinon = require('sinon')
var extend = require('xtend')
const STORAGE_KEY = 'metamask-config'

describe('MetaMaskController', function() {
  const noop = () => {}
  let controller = new MetaMaskController({
    showUnconfirmedMessage: noop,
    unlockAccountMessage: noop,
    showUnapprovedTx: noop,
    // initial state
    initState: loadData(),
  })
  // setup state persistence
  controller.store.subscribe(setData)

  beforeEach(function() {
    // sinon allows stubbing methods that are easily verified
    this.sinon = sinon.sandbox.create()
    window.localStorage = {} // Hacking localStorage support into JSDom
  })

  afterEach(function() {
    // sinon requires cleanup otherwise it will overwrite context
    this.sinon.restore()
  })

})


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
