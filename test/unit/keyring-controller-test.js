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

  beforeEach(async function () {
    this.sinon = sinon.sandbox.create()
    window.localStorage = {} // Hacking localStorage support into JSDom

    keyringController = new KeyringController({
      configManager: configManagerGen(),
      txManager: {
        getTxList: () => [],
        getUnapprovedTxList: () => [],
      },
      ethStore: {
        addAccount (acct) { accounts.push(ethUtil.addHexPrefix(acct)) },
      },
    })

    // Stub out the browser crypto for a mock encryptor.
    // Browser crypto is tested in the integration test suite.
    keyringController.encryptor = mockEncryptor

    await keyringController.createNewVaultAndKeychain(password)
  })

  afterEach(function () {
    // Cleanup mocks
    this.sinon.restore()
  })

  describe('#createNewVaultAndKeychain', function () {
    this.timeout(10000)

    it('should set a vault on the configManager', async function () {
      keyringController.store.updateState({ vault: null })
      assert(!keyringController.store.getState().vault, 'no previous vault')
      await keyringController.createNewVaultAndKeychain(password)
      const vault = keyringController.store.getState().vault
      assert(vault, 'vault creation')
    })
  })

  describe('#restoreKeyring', function () {
    it(`should pass a keyring's serialized data back to the correct type.`, async function () {
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
      const keyring = await keyringController.restoreKeyring(mockSerialized)
      assert.equal(keyring.wallets.length, 1, 'one wallet restored')

      const accounts = await keyring.getAccounts()
      mock.verify()
      assert.equal(accounts[0], addresses[0])
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
    it('sets the nickname', async function () {
      const account = addresses[0]
      var nick = 'Test nickname'
      const identities = keyringController.memStore.getState().identities
      identities[ethUtil.addHexPrefix(account)] = {}
      keyringController.memStore.updateState({ identities })

      const label = await keyringController.saveAccountLabel(account, nick)
      assert.equal(label, nick)

      const persisted = keyringController.store.getState().walletNicknames[ethUtil.addHexPrefix(account)]
      assert.equal(persisted, nick)
    })
  })

  describe('#getAccounts', function () {
    it('returns the result of getAccounts for each keyring', async function () {
      keyringController.keyrings = [
        { async getAccounts () { return await Promise.resolve([1, 2, 3]) } },
        { async getAccounts () { return await Promise.resolve([4, 5, 6]) } },
      ]

      const result = await keyringController.getAccounts()
      assert.deepEqual(result, [1, 2, 3, 4, 5, 6])
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
