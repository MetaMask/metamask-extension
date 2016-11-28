var assert = require('assert')
var KeyringController = require('../../app/scripts/keyring-controller')
var configManagerGen = require('../lib/mock-config-manager')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const async = require('async')
const mockEncryptor = require('../lib/mock-encryptor')
const MockSimpleKeychain = require('../lib/mock-simple-keychain')
const sinon = require('sinon')

describe('KeyringController', function() {

  let keyringController, state
  let password = 'password123'
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

    keyringController.createNewVaultAndKeychain(password)
    .then(function (newState) {
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
      keyringController.createNewVaultAndKeychain(password)
      .then(() => {
        const vault = keyringController.configManager.getVault()
        assert(vault, 'vault created')
        done()
      })
      .catch((reason) => {
        assert.ifError(reason)
        done()
      })
    })
  })

  describe('#restoreKeyring', function() {

    it(`should pass a keyring's serialized data back to the correct type.`, function(done) {
      const mockSerialized = {
        type: 'HD Key Tree',
        data: {
          mnemonic: seedWords,
          numberOfAccounts: 1,
        }
      }
      const mock = this.sinon.mock(keyringController)

      mock.expects('getBalanceAndNickname')
      .exactly(1)

      keyringController.restoreKeyring(mockSerialized)
      .then((keyring) => {
        assert.equal(keyring.wallets.length, 1, 'one wallet restored')
        return keyring.getAccounts()
      })
      .then((accounts) => {
        assert.equal(accounts[0], addresses[0])
        mock.verify()
        done()
      })
      .catch((reason) => {
        assert.ifError(reason)
        done()
      })
    })
  })

  describe('#migrateOldVaultIfAny', function() {
    it('should return and init a new vault', function(done) {
      keyringController.migrateOldVaultIfAny(password)
      .then(() => {
        assert(keyringController.configManager.getVault(), 'now has a vault')
        assert(keyringController.password, 'has a password set')
        done()
      })
      .catch((reason) => {
        assert.ifError(reason)
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
    it ('sets the nickname', function(done) {
      const account = addresses[0]
      var nick = 'Test nickname'
      keyringController.identities[ethUtil.addHexPrefix(account)] = {}
      keyringController.saveAccountLabel(account, nick)
      .then((label) => {
        assert.equal(label, nick)
        const persisted = keyringController.configManager.nicknameForWallet(account)
        assert.equal(persisted, nick)
        done()
      })
      .catch((reason) => {
        assert.ifError(reason)
        done()
      })
    })

    this.timeout(10000)
    it('retrieves the persisted nickname', function(done) {
      const account = addresses[0]
      var nick = 'Test nickname'
      keyringController.configManager.setNicknameForWallet(account, nick)
      keyringController.createNewVaultAndRestore(password, seedWords)
      .then((state) => {

        const identity = keyringController.identities['0x' + account]
        assert.equal(identity.name, nick)

        assert(accounts)
        done()
      })
      .catch((reason) => {
        assert.ifError(reason)
        done()
      })
    })
  })

  describe('#getAccounts', function() {
    it('returns the result of getAccounts for each keyring', function() {
      keyringController.keyrings = [
        { getAccounts() { return Promise.resolve([1,2,3]) } },
        { getAccounts() { return Promise.resolve([4,5,6]) } },
      ]

      keyringController.getAccounts()
      .then((result) => {
        assert.deepEqual(result, [1,2,3,4,5,6])
        done()
      })
    })
  })

  describe('#addGasBuffer', function() {
    it('adds 100k gas buffer to estimates', function() {

      const gas = '0x04ee59' // Actual estimated gas example
      const tooBigOutput = '0x80674f9' // Actual bad output
      const bnGas = new BN(ethUtil.stripHexPrefix(gas), 16)
      const correctBuffer = new BN('100000', 10)
      const correct = bnGas.add(correctBuffer)

      const tooBig = new BN(tooBigOutput, 16)
      const result = keyringController.addGasBuffer(gas)
      const bnResult = new BN(ethUtil.stripHexPrefix(result), 16)

      assert.equal(result.indexOf('0x'), 0, 'included hex prefix')
      assert(bnResult.gt(bnGas), 'Estimate increased in value.')
      assert.equal(bnResult.sub(bnGas).toString(10), '100000', 'added 100k gas')
      assert.equal(result, '0x' + correct.toString(16), 'Added the right amount')
      assert.notEqual(result, tooBigOutput, 'not that bad estimate')
    })
  })
})
