const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const nock = require('nock')
const MetaMaskController = require('../../app/scripts/metamask-controller')
const blacklistJSON = require('../stub/blacklist')
const firstTimeState = require('../../app/scripts/first-time-state')

const DEFAULT_LABEL = 'Account 1'
const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
const TEST_SEED_ALT = 'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle'
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'

describe('MetaMaskController', function () {
  let metamaskController
  const sandbox = sinon.sandbox.create()
  const noop = () => { }

  beforeEach(function () {

    nock('https://api.infura.io')
      .persist()
      .get('/v2/blacklist')
      .reply(200, blacklistJSON)

    nock('https://api.infura.io')
      .persist()
      .get(/.*/)
      .reply(200)

    metamaskController = new MetaMaskController({
      showUnapprovedTx: noop,
      encryptor: {
        encrypt: function (password, object) {
          this.object = object
          return Promise.resolve()
        },
        decrypt: function () {
          return Promise.resolve(this.object)
        },
      },
      initState: clone(firstTimeState),
    })
    sandbox.spy(metamaskController.keyringController, 'createNewVaultAndKeychain')
    sandbox.spy(metamaskController.keyringController, 'createNewVaultAndRestore')
  })

  afterEach(function () {
    nock.cleanAll()
    sandbox.restore()
  })

  describe('#getGasPrice', function () {
    it('gives the 50th percentile lowest accepted gas price from recentBlocksController', async function () {
      const realRecentBlocksController = metamaskController.recentBlocksController
      metamaskController.recentBlocksController = {
        store: {
          getState: () => {
            return {
              recentBlocks: [
                { gasPrices: [ '0x3b9aca00', '0x174876e800'] },
                { gasPrices: [ '0x3b9aca00', '0x174876e800'] },
                { gasPrices: [ '0x174876e800', '0x174876e800' ]},
                { gasPrices: [ '0x174876e800', '0x174876e800' ]},
              ],
            }
          },
        },
      }

      const gasPrice = metamaskController.getGasPrice()
      assert.equal(gasPrice, '0x3b9aca00', 'accurately estimates 50th percentile accepted gas price')

      metamaskController.recentBlocksController = realRecentBlocksController
    })
  })

  describe('#createNewVaultAndKeychain', function () {
    it('can only create new vault on keyringController once', async function () {
      const selectStub = sandbox.stub(metamaskController, 'selectFirstIdentity')

      const password = 'a-fake-password'

      await metamaskController.createNewVaultAndKeychain(password)
      await metamaskController.createNewVaultAndKeychain(password)

      assert(metamaskController.keyringController.createNewVaultAndKeychain.calledOnce)

      selectStub.reset()
    })
  })

  describe('#createNewVaultAndRestore', function () {
    it('should be able to call newVaultAndRestore despite a mistake.', async function () {
      const password = 'what-what-what'
      await metamaskController.createNewVaultAndRestore(password, TEST_SEED.slice(0, -1)).catch((e) => null)
      await metamaskController.createNewVaultAndRestore(password, TEST_SEED)

      assert(metamaskController.keyringController.createNewVaultAndRestore.calledTwice)
    })

    it('should clear previous identities after vault restoration', async () => {
      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED)
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
      })

      await metamaskController.keyringController.saveAccountLabel(TEST_ADDRESS, 'Account Foo')
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: 'Account Foo' },
      })

      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS_ALT]: { address: TEST_ADDRESS_ALT, name: DEFAULT_LABEL },
      })
    })
  })
})
