const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const MetaMaskController = require('../../app/scripts/metamask-controller')
const firstTimeState = require('../../app/scripts/first-time-state')
const BN = require('ethereumjs-util').BN
const GWEI_BN = new BN('1000000000')

describe('MetaMaskController', function () {
  const noop = () => {}
  const metamaskController = new MetaMaskController({
    showUnconfirmedMessage: noop,
    unlockAccountMessage: noop,
    showUnapprovedTx: noop,
    platform: {},
    encryptor: {
      encrypt: function(password, object) {
        this.object = object
        return Promise.resolve()
      },
      decrypt: function () {
        return Promise.resolve(this.object)
      }
    },
    // initial state
    initState: clone(firstTimeState),
  })

  beforeEach(function () {
    // sinon allows stubbing methods that are easily verified
    this.sinon = sinon.sandbox.create()
  })

  afterEach(function () {
    // sinon requires cleanup otherwise it will overwrite context
    this.sinon.restore()
  })

  describe('Metamask Controller', function () {
    assert(metamaskController)

    beforeEach(function () {
      sinon.spy(metamaskController.keyringController, 'createNewVaultAndKeychain')
    })

    afterEach(function () {
      metamaskController.keyringController.createNewVaultAndKeychain.restore()
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
                ]
              }
            }
          }
        }

        const gasPrice = metamaskController.getGasPrice()
        assert.equal(gasPrice, '0x3b9aca00', 'accurately estimates 50th percentile accepted gas price')

        metamaskController.recentBlocksController = realRecentBlocksController
      })
    })

    describe('#createNewVaultAndKeychain', function () {
      it('can only create new vault on keyringController once', async function () {

        const selectStub = sinon.stub(metamaskController, 'selectFirstIdentity')

        const password = 'a-fake-password'

        const first = await metamaskController.createNewVaultAndKeychain(password)
        const second = await metamaskController.createNewVaultAndKeychain(password)

        assert(metamaskController.keyringController.createNewVaultAndKeychain.calledOnce)

        selectStub.reset()
      })
    })
  })
})

