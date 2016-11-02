var assert = require('assert')
var KeyringController = require('../../app/scripts/keyring-controller')
var configManagerGen = require('../lib/mock-config-manager')
const ethUtil = require('ethereumjs-util')
const async = require('async')
const mockEncryptor = require('../lib/mock-encryptor')
const MockSimpleKeychain = require('../lib/mock-simple-keychain')
const sinon = require('sinon')

describe('KeyringController', function() {

  let keyringController
  let password = 'password123'
  let entropy = 'entripppppyy duuude'
  let seedWords
  let accounts = []
  let originalKeystore

  beforeEach(function(done) {
    this.sinon = sinon.sandbox.create()
    window.localStorage = {} // Hacking localStorage support into JSDom

    keyringController = new KeyringController({
      configManager: configManagerGen(),
      ethStore: {
        addAccount(acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
      },
    })

    // Stub out the browser crypto for a mock encryptor.
    // Browser crypto is tested in the integration test suite.
    keyringController.encryptor = mockEncryptor

    keyringController.createNewVaultAndKeychain(password, null, function (err, state) {
      done()
    })
  })

  afterEach(function() {
    // Cleanup mocks
    this.sinon.restore()
  })

  describe('#createNewVaultAndKeychain', function () {
    it('should set a vault on the configManager', function(done) {
      keyringController.configManager.setVault(null)
      assert(!keyringController.configManager.getVault(), 'no previous vault')
      keyringController.createNewVaultAndKeychain(password, null, (err, state) => {
        assert.ifError(err)
        const vault = keyringController.configManager.getVault()
        assert(vault, 'vault created')
        done()
      })
    })
  })

  describe('#restoreKeyring', function() {

    it(`should pass a keyring's serialized data back to the correct type.`, function() {
      keyringController.keyringTypes = [ MockSimpleKeychain ]

      const mockSerialized = {
        type: MockSimpleKeychain.type(),
        data: [ '0x123456null788890abcdef' ],
      }
      const mock = this.sinon.mock(keyringController)

      mock.expects('loadBalanceAndNickname')
      .exactly(1)

      var keyring = keyringController.restoreKeyring(0, mockSerialized)
      assert.equal(keyring.wallets.length, 1, 'one wallet restored')
      mock.verify()
    })

  })

  describe('#migrateAndGetKey', function() {
    it('should return the key for that password', function(done) {
      keyringController.migrateAndGetKey(password)
      .then((key) => {
        assert(key, 'a key is returned')
        done()
      })
    })
  })

})





