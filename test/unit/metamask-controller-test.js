const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const MetaMaskController = require('../../app/scripts/metamask-controller')
const firstTimeState = require('../../app/scripts/first-time-state')

describe('MetaMaskController', function () {
  const noop = () => {}
  const metamaskController = new MetaMaskController({
    showUnconfirmedMessage: noop,
    unlockAccountMessage: noop,
    showUnapprovedTx: noop,
    platform: {},
    encryptor: {
      encrypt: function(password, object) {
        console.log('encrypting ', object)
        this.object = object
        return Promise.resolve()
      },
      decrypt: function () {
        console.log('decrypting')
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

    describe('#createNewVaultAndKeychain', function () {
      it('can only create new vault on keyringController once', async function () {

        const selectStub = sinon.stub(metamaskController, 'selectFirstIdentity')

        const password = 'a-fake-password'

        const first = await metamaskController.createNewVaultAndKeychain(password)
        console.log('FIRST ONE RETURNED:')
        console.dir(first)
        const second = await metamaskController.createNewVaultAndKeychain(password)
        console.log('SECOND ONE RETURNED:')
        console.dir(second)

        assert(metamaskController.keyringController.createNewVaultAndKeychain.calledOnce)

        selectStub.reset()
      })
    })
  })
})

