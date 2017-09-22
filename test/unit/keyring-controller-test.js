const assert = require('assert')
const KeyringController = require('../../app/scripts/keyring-controller')
const configManagerGen = require('../lib/mock-config-manager')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const mockEncryptor = require('../lib/mock-encryptor')
const sinon = require('sinon')

describe('KeyringController', function () {
  let keyringController
  const password = 'password123'
  const seedWords = 'puzzle seed penalty soldier say clay field arctic metal hen cage runway'
  const addresses = ['eF35cA8EbB9669A35c31b5F6f249A9941a812AC1'.toLowerCase()]
  const accounts = []
  // let originalKeystore

  beforeEach(function (done) {
    this.sinon = sinon.sandbox.create()
    window.localStorage = {} // Hacking localStorage support into JSDom

    keyringController = new KeyringController({
      configManager: configManagerGen(),
      txManager: {
        getTxList: () => [],
        getUnapprovedTxList: () => [],
      },
      accountTracker: {
        addAccount (acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
      },
    })

    // Stub out the browser crypto for a mock encryptor.
    // Browser crypto is tested in the integration test suite.
    keyringController.encryptor = mockEncryptor

    keyringController.createNewVaultAndKeychain(password)
    .then(function (newState) {
      newState
      done()
    })
    .catch((err) => {
      done(err)
    })
  })

  afterEach(function () {
    // Cleanup mocks
    this.sinon.restore()
  })

  describe('#createNewVaultAndKeychain', function () {
    this.timeout(10000)

    it('should set a vault on the configManager', function (done) {
      keyringController.store.updateState({ vault: null })
      assert(!keyringController.store.getState().vault, 'no previous vault')
      keyringController.createNewVaultAndKeychain(password)
      .then(() => {
        const vault = keyringController.store.getState().vault
        assert(vault, 'vault created')
        done()
      })
      .catch((reason) => {
        done(reason)
      })
    })
  })

  describe('#restoreKeyring', function () {
    it(`should pass a keyring's serialized data back to the correct type.`, function (done) {
      const mockSerialized = {
        type: 'HD Key Tree',
        data: {
          mnemonic: seedWords,
          numberOfAccounts: 1,
        },
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
        done(reason)
      })
    })
  })

  describe('#createNickname', function () {
    it('should add the address to the identities hash', function () {
      const fakeAddress = '0x12345678'
      keyringController.createNickname(fakeAddress)
      const identities = keyringController.memStore.getState().identities
      const identity = identities[fakeAddress]
      assert.equal(identity.address, fakeAddress)
    })
  })

  describe('#saveAccountLabel', function () {
    it('sets the nickname', function (done) {
      const account = addresses[0]
      var nick = 'Test nickname'
      const identities = keyringController.memStore.getState().identities
      identities[ethUtil.addHexPrefix(account)] = {}
      keyringController.memStore.updateState({ identities })
      keyringController.saveAccountLabel(account, nick)
      .then((label) => {
        try {
          assert.equal(label, nick)
          const persisted = keyringController.store.getState().walletNicknames[account]
          assert.equal(persisted, nick)
          done()
        } catch (err) {
          done()
        }
      })
      .catch((reason) => {
        done(reason)
      })
    })
  })

  describe('#getAccounts', function () {
    it('returns the result of getAccounts for each keyring', function (done) {
      keyringController.keyrings = [
        { getAccounts () { return Promise.resolve([1, 2, 3]) } },
        { getAccounts () { return Promise.resolve([4, 5, 6]) } },
      ]

      keyringController.getAccounts()
      .then((result) => {
        assert.deepEqual(result, [1, 2, 3, 4, 5, 6])
        done()
      })
    })
  })

  describe('#addGasBuffer', function () {
    it('adds 100k gas buffer to estimates', function () {
      const gas = '0x04ee59' // Actual estimated gas example
      const tooBigOutput = '0x80674f9' // Actual bad output
      const bnGas = new BN(ethUtil.stripHexPrefix(gas), 16)
      const correctBuffer = new BN('100000', 10)
      const correct = bnGas.add(correctBuffer)

      // const tooBig = new BN(tooBigOutput, 16)
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
