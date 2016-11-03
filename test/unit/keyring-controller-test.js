var assert = require('assert')
var KeyringController = require('../../app/scripts/keyring-controller')
var configManagerGen = require('../lib/mock-config-manager')
const ethUtil = require('ethereumjs-util')
const async = require('async')
const mockEncryptor = require('../lib/mock-encryptor')
const MockSimpleKeychain = require('../lib/mock-simple-keychain')
const sinon = require('sinon')

describe('KeyringController', function() {

  let keyringController, state
  let password = 'password123'
  let entropy = 'entripppppyy duuude'
  let seedWords = 'puzzle seed penalty soldier say clay field arctic metal hen cage runway'
  let addresses = ['eF35cA8EbB9669A35c31b5F6f249A9941a812AC1'.toLowerCase()]
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

    keyringController.createNewVaultAndKeychain(password, null, function (err, newState) {
      assert.ifError(err)
      state = newState
      done()
    })
  })

  afterEach(function() {
    // Cleanup mocks
    this.sinon.restore()
  })

  describe('#createNewVaultAndKeychain', function () {
    this.timeout(10000)

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
      const mockSerialized = {
        type: 'HD Key Tree',
        data: {
          mnemonic: seedWords,
          n: 1,
        }
      }
      const mock = this.sinon.mock(keyringController)

      mock.expects('loadBalanceAndNickname')
      .exactly(1)

      var keyring = keyringController.restoreKeyring(mockSerialized)
      assert.equal(keyring.wallets.length, 1, 'one wallet restored')
      assert.equal(keyring.getAccounts()[0], addresses[0])
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

  describe('#createNickname', function() {
    it('should add the address to the identities hash', function() {
      const fakeAddress = '0x12345678'
      keyringController.createNickname(fakeAddress)
      const identities = keyringController.identities
      const identity = identities[fakeAddress]
      assert.equal(identity.address, fakeAddress)

      const nick = keyringController.configManager.nicknameForWallet(fakeAddress)
      assert.equal(typeof nick, 'string')
    })
  })

  describe('#saveAccountLabel', function() {
    it ('sets the nickname', function() {
      const account = addresses[0]
      var nick = 'Test nickname'
      const label = keyringController.saveAccountLabel(account, nick)
      assert.equal(label, nick)

      const persisted = keyringController.configManager.nicknameForWallet(account)
      assert.equal(persisted, nick)
    })
  })
})





