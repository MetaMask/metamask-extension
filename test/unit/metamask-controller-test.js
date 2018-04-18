const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const nock = require('nock')
const MetaMaskController = require('../../app/scripts/metamask-controller')
const blacklistJSON = require('../stub/blacklist')
const firstTimeState = require('../../app/scripts/first-time-state')

describe('MetaMaskController', function () {
  let metamaskController
  const sandbox = sinon.createSandbox()
  const noop = () => {}

  beforeEach(function () {

    nock('https://api.infura.io')
      .persist()
      .get('/v2/blacklist')
      .reply(200, blacklistJSON)

    nock('https://api.infura.io')
      .get('/v1/ticker/ethusd')
      .reply(200, '{"base": "ETH", "quote": "USD", "bid": 288.45, "ask": 288.46, "volume": 112888.17569277, "exchange": "bitfinex", "total_volume": 272175.00106721005, "num_exchanges": 8, "timestamp": 1506444677}')

    nock('https://api.infura.io')
      .get('/v1/ticker/ethjpy')
      .reply(200, '{"base": "ETH", "quote": "JPY", "bid": 32300.0, "ask": 32400.0, "volume": 247.4616071, "exchange": "kraken", "total_volume": 247.4616071, "num_exchanges": 1, "timestamp": 1506444676}')

    nock('https://api.infura.io')
      .persist()
      .get(/.*/)
      .reply(200)

    metamaskController = new MetaMaskController({
      showUnapprovedTx: noop,
      showUnconfirmedMessage: noop,
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

  describe('#getApi', function () {
    let getApi, state

    beforeEach(function () {
      getApi = metamaskController.getApi()
    })

    it('getState', function (done) {
      getApi.getState((err, res) => {
        if (err) {
          done(err)
        } else {
          state = res
        }
      })
      assert.deepEqual(state, metamaskController.getState())
      done()
    })

  })

  describe('preferencesController', function () {

    it('defaults useBlockie to false', function () {
      assert.equal(metamaskController.preferencesController.store.getState().useBlockie, false)
    })

    it('setUseBlockie to true', async function () {
      metamaskController.setUseBlockie(true, noop)
      assert.equal(metamaskController.preferencesController.store.getState().useBlockie, true)
    })

  })

  describe('#selectFirstIdentity', function () {
    let identities, address

    beforeEach(function () {
      address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
      identities = {
        identities: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            'address': '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            'name': 'Account 1',
          },
        },
      }
      metamaskController.selectFirstIdentity(identities)
    })

    it('changes preferences controller select address', function () {
      const preferenceControllerState = metamaskController.preferencesController.store.getState()
      assert.equal(preferenceControllerState.selectedAddress, address)
    })

    it('changes metamask controller selected address', function () {
      const metamaskState = metamaskController.getState()
      assert.equal(metamaskState.selectedAddress, address)
    })
  })

  describe('#setCustomRpc', function () {
    const customRPC = 'https://custom.rpc/'
    let rpcTarget

    beforeEach(function () {

      nock('https://custom.rpc')
      .post('/')
      .reply(200)

      rpcTarget = metamaskController.setCustomRpc(customRPC)
    })

    it('returns custom RPC that when called', async function () {
      assert.equal(await rpcTarget, customRPC)
    })

    it('changes the network controller rpc', function () {
      const networkControllerState = metamaskController.networkController.store.getState()
      assert.equal(networkControllerState.provider.rpcTarget, customRPC)
    })
  })

  describe('#setCurrentCurrency', function () {
    let defaultMetaMaskCurrency

    beforeEach(function () {
      defaultMetaMaskCurrency = metamaskController.currencyController.getCurrentCurrency()
    })

    it('defaults to usd', function () {
      assert.equal(defaultMetaMaskCurrency, 'usd')
    })

    it('sets currency to JPY', function () {
      metamaskController.setCurrentCurrency('JPY', noop)
      assert.equal(metamaskController.currencyController.getCurrentCurrency(), 'JPY')
    })
  })

  describe('#createShapeshifttx', function () {
    let depositAddress, depositType, shapeShiftTxList

    beforeEach(function () {
      nock('https://shapeshift.io')
        .get('/txStat/3EevLFfB4H4XMWQwYCgjLie1qCAGpd2WBc')
        .reply(200, '{"status": "no_deposits", "address": "3EevLFfB4H4XMWQwYCgjLie1qCAGpd2WBc"}')

      depositAddress = '3EevLFfB4H4XMWQwYCgjLie1qCAGpd2WBc'
      depositType = 'ETH'
      shapeShiftTxList = metamaskController.shapeshiftController.store.getState().shapeShiftTxList
    })

    it('creates a shapeshift tx', async function () {
      metamaskController.createShapeShiftTx(depositAddress, depositType)
      assert.equal(shapeShiftTxList[0].depositAddress, depositAddress)
    })

  })

  describe('#addNewAccount', function () {
    let addNewAccount

    beforeEach(function () {
      addNewAccount = metamaskController.addNewAccount()
    })

    it('errors when an primary keyring is does not exist', async function () {
      try {
        await addNewAccount
        assert.equal(1 === 0)
      } catch (e) {
        assert.equal(e.message, 'MetamaskController - No HD Key Tree found')
      }
    })
  })

  describe('#verifyseedPhrase', function () {
    let seedPhrase, getConfigSeed

    it('errors when no keying is provided', async function () {
      try {
        await metamaskController.verifySeedPhrase()
      } catch (error) {
        assert.equal(error.message, 'MetamaskController - No HD Key Tree found')
      }
    })

    beforeEach(async function () {
      await metamaskController.createNewVaultAndKeychain('password')
      seedPhrase = await metamaskController.verifySeedPhrase()
    })

    it('#placeSeedWords should match the initially created vault seed', function () {

      metamaskController.placeSeedWords((err, result) => {
        if (err) {
         console.log(err)
        } else {
          getConfigSeed = metamaskController.configManager.getSeedWords()
          assert.equal(result, seedPhrase)
          assert.equal(result, getConfigSeed)
        }
      })
      assert.equal(getConfigSeed, undefined)
    })
  })

  describe('#clearSeedWordCache', function () {

    it('should have set seed words', function () {
      metamaskController.configManager.setSeedWords('test words')
      const getConfigSeed = metamaskController.configManager.getSeedWords()
      assert.equal(getConfigSeed, 'test words')
    })

    it('should clear config seed phrase', function () {
      metamaskController.configManager.setSeedWords('test words')
      metamaskController.clearSeedWordCache((err, result) => {
        if (err) console.log(err)
      })
      const getConfigSeed = metamaskController.configManager.getSeedWords()
      assert.equal(getConfigSeed, null)
    })

  })

  describe('#setCurrentLocale', function () {

    it('checks the default currentLocale', function () {
      const preferenceCurrentLocale = metamaskController.preferencesController.store.getState().currentLocale
      assert.equal(preferenceCurrentLocale, undefined)
    })

    it('sets current locale in preferences controller', function () {
      metamaskController.setCurrentLocale('ja', noop)
      const preferenceCurrentLocale = metamaskController.preferencesController.store.getState().currentLocale
      assert.equal(preferenceCurrentLocale, 'ja')
    })

  })

  describe('#newUnsignedMessage', function () {

    let msgParams, metamaskMsgs, messages, msgId

    const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
    const data = '0x43727970746f6b697474696573'

    beforeEach(function () {

      msgParams = {
        'from': address,
        'data': data,
      }

      metamaskController.newUnsignedMessage(msgParams, noop)
      metamaskMsgs = metamaskController.messageManager.getUnapprovedMsgs()
      messages = metamaskController.messageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
    })

    it('persists address from msg params', function () {
      assert.equal(metamaskMsgs[msgId].msgParams.from, address)
    })

    it('persists data from msg params', function () {
      assert.equal(metamaskMsgs[msgId].msgParams.data, data)
    })

    it('sets the status to unapproved', function () {
      assert.equal(metamaskMsgs[msgId].status, 'unapproved')
    })

    it('sets the type to eth_sign', function () {
      assert.equal(metamaskMsgs[msgId].type, 'eth_sign')
    })

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId)
      metamaskController.cancelMessage(msgIdInt, noop)
      assert.equal(messages[0].status, 'rejected')
    })
  })

  describe('#newUnsignedPersonalMessage', function () {

    let msgParams, metamaskMsgs, messages, msgId

    const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
    const data = '0x43727970746f6b697474696573'

    beforeEach(function () {

      msgParams = {
        'from': address,
        'data': data,
      }

      metamaskController.newUnsignedPersonalMessage(msgParams, noop)
      metamaskMsgs = metamaskController.personalMessageManager.getUnapprovedMsgs()
      messages = metamaskController.personalMessageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
    })

    it('persists address from msg params', function () {
      assert.equal(metamaskMsgs[msgId].msgParams.from, address)
    })

    it('persists data from msg params', function () {
      assert.equal(metamaskMsgs[msgId].msgParams.data, data)
    })

    it('sets the status to unapproved', function () {
      assert.equal(metamaskMsgs[msgId].status, 'unapproved')
    })

    it('sets the type to personal_sign', function () {
      assert.equal(metamaskMsgs[msgId].type, 'personal_sign')
    })

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId)
      metamaskController.cancelPersonalMessage(msgIdInt, noop)
      assert.equal(messages[0].status, 'rejected')
    })
  })

})
