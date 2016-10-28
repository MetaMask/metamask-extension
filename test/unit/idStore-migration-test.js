const async = require('async')
const assert = require('assert')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const configManagerGen = require('../lib/mock-config-manager')
const delegateCallCode = require('../lib/example-code.json').delegateCallCode

// The old way:
const IdentityStore = require('../../app/scripts/lib/idStore')

// The new ways:
var KeyringController = require('../../app/scripts/keyring-controller')
const mockEncryptor = require('../lib/mock-encryptor')
const MockSimpleKeychain = require('../lib/mock-simple-keychain')
const sinon = require('sinon')

const mockVault = {
  seed: 'picnic injury awful upper eagle junk alert toss flower renew silly vague',
  account: '0x5d8de92c205279c10e5669f797b853ccef4f739a',
}

describe('IdentityStore to KeyringController migration', function() {

  // The stars of the show:
  let idStore, keyringController, seedWords

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
    var configManager = configManagerGen()

    window.localStorage = {} // Hacking localStorage support into JSDom

    idStore = new IdentityStore({
      configManager: configManagerGen(),
      ethStore: {
        addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
        del(acct) { delete accounts[acct] },
      },
    })

    idStore._createVault(password, mockVault.seed, null, function (err, seeds) {
      assert.ifError(err, 'createNewVault threw error')
      originalKeystore = idStore._idmgmt.keyStore

      idStore.setLocked(function(err) {
        assert.ifError(err, 'createNewVault threw error')
        keyringController = new KeyringController({
          configManager,
          ethStore: {
            addAccount(acct) { newAccounts.push(ethUtil.addHexPrefix(acct)) },
          },
        })

        // Stub out the browser crypto for a mock encryptor.
        // Browser crypto is tested in the integration test suite.
        keyringController.encryptor = mockEncryptor
        done()
      })
    })
  })

  describe('creating new vault type', function() {
    it('should use the password to migrate the old vault', function(done) {
      keyringController.createNewVault(password, null, function (err, state) {
        assert.ifError(err, 'createNewVault threw error')

        let newAccounts = keyringController.getAccounts()
        let newAccount = ethUtil.addHexPrefix(newAccounts[0])
        assert.equal(newAccount, accounts[0], 'restored the account')
        assert.equal(newAccount, mockVault.account, 'restored the correct account')

        const newSeed = keyringController.keyrings[0].mnemonic
        assert.equal(newSeed, mockVault.seed, 'seed phrase transferred.')

        assert(configManager.getVault(), 'new type of vault is persisted')
        done()
      })
    })
  })
})

