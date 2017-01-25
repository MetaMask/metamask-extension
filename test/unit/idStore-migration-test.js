const async = require('async')
const assert = require('assert')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const ConfigManager = require('../../app/scripts/lib/config-manager')
const delegateCallCode = require('../lib/example-code.json').delegateCallCode

// The old way:
const IdentityStore = require('../../app/scripts/lib/idStore')
const STORAGE_KEY = 'metamask-config'
const extend = require('xtend')

// The new ways:
var KeyringController = require('../../app/scripts/keyring-controller')
const mockEncryptor = require('../lib/mock-encryptor')
const MockSimpleKeychain = require('../lib/mock-simple-keychain')
const sinon = require('sinon')

const mockVault = {
  seed: 'picnic injury awful upper eagle junk alert toss flower renew silly vague',
  account: '0x5d8de92c205279c10e5669f797b853ccef4f739a',
}

const badVault = {
  seed: 'radar blur cabbage chef fix engine embark joy scheme fiction master release',
}

describe('IdentityStore to KeyringController migration', function() {

  // The stars of the show:
  let idStore, keyringController, seedWords, configManager

  let password = 'password123'
  let entropy = 'entripppppyy duuude'
  let accounts = []
  let newAccounts = []
  let originalKeystore

  // This is a lot of setup, I know!
  // We have to create an old style vault, populate it,
  // and THEN create a new one, before we can run tests on it.
  beforeEach(function(done) {
    this.sinon = sinon.sandbox.create()
    window.localStorage = {} // Hacking localStorage support into JSDom
    let store = new ObservableStore(loadData())
    store.subscribe(setData)
    configManager = new ConfigManager({ store })


    idStore = new IdentityStore({
      configManager: configManager,
      ethStore: {
        addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
        del(acct) { delete accounts[acct] },
      },
    })

    idStore._createVault(password, mockVault.seed, (err) => {
      assert.ifError(err, 'createNewVault threw error')
      originalKeystore = idStore._idmgmt.keyStore

      idStore.setLocked((err) => {
        assert.ifError(err, 'createNewVault threw error')
        keyringController = new KeyringController({
          configManager,
          ethStore: {
            addAccount(acct) { newAccounts.push(ethUtil.addHexPrefix(acct)) },
            del(acct) { delete newAccounts[acct] },
          },
          txManager: {
            getTxList: () => [],
            getUnapprovedTxList: () => []
          },
        })

        // Stub out the browser crypto for a mock encryptor.
        // Browser crypto is tested in the integration test suite.
        keyringController.encryptor = mockEncryptor
        done()
      })
    })
  })

  describe('entering a password', function() {
    it('should identify an old wallet as an initialized keyring', function(done) {
      keyringController.configManager.setWallet('something')
      keyringController.getState()
      .then((state) => {
        assert(state.isInitialized, 'old vault counted as initialized.')
        assert(!state.lostAccounts, 'no lost accounts')
        done()
      })
    })
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

function setData (data) {
  window.localStorage[STORAGE_KEY] = JSON.stringify(data)
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
