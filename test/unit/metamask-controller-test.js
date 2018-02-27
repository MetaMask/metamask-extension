const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const nock = require('nock')
const MetaMaskController = require('../../app/scripts/metamask-controller')
const blacklistJSON = require('../stub/blacklist')
const firstTimeState = require('../../app/scripts/first-time-state')

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
      const wrongSeed = 'debris dizzy just program just float decrease vacant alarm reduce speak stadiu'
      const rightSeed = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
      await metamaskController.createNewVaultAndRestore(password, wrongSeed)
        .catch((e) => {
          return
        })
      await metamaskController.createNewVaultAndRestore(password, rightSeed)

      assert(metamaskController.keyringController.createNewVaultAndRestore.calledTwice)
    })
  })
})
