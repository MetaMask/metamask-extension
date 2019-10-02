const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const nock = require('nock')
const createThoughStream = require('through2').obj
const blacklistJSON = require('eth-phishing-detect/src/config')
const firstTimeState = require('../../../unit/localhostState')
const createTxMeta = require('../../../lib/createTxMeta')
const EthQuery = require('eth-query')

const threeBoxSpies = {
  init: sinon.spy(),
  getThreeBoxAddress: sinon.spy(),
  getThreeBoxSyncingState: sinon.stub().returns(true),
  turnThreeBoxSyncingOn: sinon.spy(),
  _registerUpdates: sinon.spy(),
}
const proxyquire = require('proxyquire')

class ThreeBoxControllerMock {
  constructor () {
    this.store = {
      subscribe: () => {},
      getState: () => ({}),
    }
    this.init = threeBoxSpies.init
    this.getThreeBoxAddress = threeBoxSpies.getThreeBoxAddress
    this.getThreeBoxSyncingState = threeBoxSpies.getThreeBoxSyncingState
    this.turnThreeBoxSyncingOn = threeBoxSpies.turnThreeBoxSyncingOn
    this._registerUpdates = threeBoxSpies._registerUpdates
  }
}

const MetaMaskController = proxyquire('../../../../app/scripts/metamask-controller', {
  './controllers/threebox': ThreeBoxControllerMock,
})

const currentNetworkId = 42
const DEFAULT_LABEL = 'Account 1'
const DEFAULT_LABEL_2 = 'Account 2'
const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
const TEST_ADDRESS_2 = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'
const TEST_ADDRESS_3 = '0xeb9e64b93097bc15f01f13eae97015c57ab64823'
const TEST_SEED_ALT = 'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle'
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'
const CUSTOM_RPC_URL = 'http://localhost:8545'

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

    nock('https://min-api.cryptocompare.com')
      .persist()
      .get(/.*/)
      .reply(200, '{"JPY":12415.9}')

    metamaskController = new MetaMaskController({
      showUnapprovedTx: noop,
      showUnconfirmedMessage: noop,
      encryptor: {
        encrypt: function (_, object) {
          this.object = object
          return Promise.resolve('mock-encrypted')
        },
        decrypt: function () {
          return Promise.resolve(this.object)
        },
      },
      initState: clone(firstTimeState),
      platform: { showTransactionNotification: () => {} },
    })
    // disable diagnostics
    metamaskController.diagnostics = null
    // add sinon method spies
    sandbox.spy(metamaskController.keyringController, 'createNewVaultAndKeychain')
    sandbox.spy(metamaskController.keyringController, 'createNewVaultAndRestore')
  })

  afterEach(function () {
    nock.cleanAll()
    sandbox.restore()
  })

  describe('submitPassword', function () {
    const password = 'password'

    beforeEach(async function () {
      await metamaskController.createNewVaultAndKeychain(password)
      threeBoxSpies.init.reset()
      threeBoxSpies.turnThreeBoxSyncingOn.reset()
    })

    it('removes any identities that do not correspond to known accounts.', async function () {
      const fakeAddress = '0xbad0'
      metamaskController.preferencesController.addAddresses([fakeAddress])
      await metamaskController.submitPassword(password)

      const identities = Object.keys(metamaskController.preferencesController.store.getState().identities)
      const addresses = await metamaskController.keyringController.getAccounts()

      identities.forEach((identity) => {
        assert.ok(addresses.includes(identity), `addresses should include all IDs: ${identity}`)
      })

      addresses.forEach((address) => {
        assert.ok(identities.includes(address), `identities should include all Addresses: ${address}`)
      })
    })

    it('gets the address from threebox and creates a new 3box instance', async () => {
      await metamaskController.submitPassword(password)
      assert(threeBoxSpies.init.calledOnce)
      assert(threeBoxSpies.turnThreeBoxSyncingOn.calledOnce)
    })
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
      assert.equal(gasPrice, '0x174876e800', 'accurately estimates 65th percentile accepted gas price')

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
      sandbox.stub(metamaskController, 'getBalance')
      metamaskController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await metamaskController.createNewVaultAndRestore(password, TEST_SEED.slice(0, -1)).catch(() => null)
      await metamaskController.createNewVaultAndRestore(password, TEST_SEED)

      assert(metamaskController.keyringController.createNewVaultAndRestore.calledTwice)
    })

    it('should clear previous identities after vault restoration', async () => {
      sandbox.stub(metamaskController, 'getBalance')
      metamaskController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED)
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
      })

      await metamaskController.preferencesController.setAccountLabel(TEST_ADDRESS, 'Account Foo')
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: 'Account Foo' },
      })

      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS_ALT]: { address: TEST_ADDRESS_ALT, name: DEFAULT_LABEL },
      })
    })

    it('should restore any consecutive accounts with balances', async () => {
      sandbox.stub(metamaskController, 'getBalance')
      metamaskController.getBalance.withArgs(TEST_ADDRESS).callsFake(() => {
        return Promise.resolve('0x14ced5122ce0a000')
      })
      metamaskController.getBalance.withArgs(TEST_ADDRESS_2).callsFake(() => {
        return Promise.resolve('0x0')
      })
      metamaskController.getBalance.withArgs(TEST_ADDRESS_3).callsFake(() => {
        return Promise.resolve('0x14ced5122ce0a000')
      })

      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED)
      assert.deepEqual(metamaskController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
        [TEST_ADDRESS_2]: { address: TEST_ADDRESS_2, name: DEFAULT_LABEL_2 },
      })
    })
  })

  describe('#getBalance', () => {
    it('should return the balance known by accountTracker', async () => {
      const accounts = {}
      const balance = '0x14ced5122ce0a000'
      accounts[TEST_ADDRESS] = { balance: balance }

      metamaskController.accountTracker.store.putState({ accounts: accounts })

      const gotten = await metamaskController.getBalance(TEST_ADDRESS)

      assert.equal(balance, gotten)
    })

    it('should ask the network for a balance when not known by accountTracker', async () => {
      const accounts = {}
      const balance = '0x14ced5122ce0a000'
      const ethQuery = new EthQuery()
      sinon.stub(ethQuery, 'getBalance').callsFake((_, callback) => {
        callback(undefined, balance)
      })

      metamaskController.accountTracker.store.putState({ accounts: accounts })

      const gotten = await metamaskController.getBalance(TEST_ADDRESS, ethQuery)

      assert.equal(balance, gotten)
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

    it('setUseBlockie to true', function () {
      metamaskController.setUseBlockie(true, noop)
      assert.equal(metamaskController.preferencesController.store.getState().useBlockie, true)
    })

  })

  describe('#selectFirstIdentity', function () {
    let identities, address

    beforeEach(function () {
      address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
      identities = {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          'address': address,
          'name': 'Account 1',
        },
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
          'address': '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          'name': 'Account 2',
        },
      }
      metamaskController.preferencesController.store.updateState({ identities })
      metamaskController.selectFirstIdentity()
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

  describe('connectHardware', function () {

    it('should throw if it receives an unknown device name', async function () {
      try {
        await metamaskController.connectHardware('Some random device name', 0, `m/44/0'/0'`)
      } catch (e) {
        assert.equal(e, 'Error: MetamaskController:getKeyringForDevice - Unknown device')
      }
    })

    it('should add the Trezor Hardware keyring', async function () {
      sinon.spy(metamaskController.keyringController, 'addNewKeyring')
      await metamaskController.connectHardware('trezor', 0).catch(() => null)
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Trezor Hardware'
      )
      assert.equal(metamaskController.keyringController.addNewKeyring.getCall(0).args, 'Trezor Hardware')
      assert.equal(keyrings.length, 1)
    })

    it('should add the Ledger Hardware keyring', async function () {
      sinon.spy(metamaskController.keyringController, 'addNewKeyring')
      await metamaskController.connectHardware('ledger', 0).catch(() => null)
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Ledger Hardware'
      )
      assert.equal(metamaskController.keyringController.addNewKeyring.getCall(0).args, 'Ledger Hardware')
      assert.equal(keyrings.length, 1)
    })

  })

  describe('checkHardwareStatus', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await metamaskController.checkHardwareStatus('Some random device name', `m/44/0'/0'`)
      } catch (e) {
        assert.equal(e, 'Error: MetamaskController:getKeyringForDevice - Unknown device')
      }
    })

    it('should be locked by default', async function () {
      await metamaskController.connectHardware('trezor', 0).catch(() => null)
      const status = await metamaskController.checkHardwareStatus('trezor')
      assert.equal(status, false)
    })
  })

  describe('forgetDevice', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await metamaskController.forgetDevice('Some random device name')
      } catch (e) {
        assert.equal(e, 'Error: MetamaskController:getKeyringForDevice - Unknown device')
      }
    })

    it('should wipe all the keyring info', async function () {
      await metamaskController.connectHardware('trezor', 0).catch(() => null)
      await metamaskController.forgetDevice('trezor')
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Trezor Hardware'
      )

      assert.deepEqual(keyrings[0].accounts, [])
      assert.deepEqual(keyrings[0].page, 0)
      assert.deepEqual(keyrings[0].isUnlocked(), false)
    })
  })

  describe('unlockHardwareWalletAccount', function () {
    let accountToUnlock
    let windowOpenStub
    let addNewAccountStub
    let getAccountsStub
    beforeEach(async function () {
      accountToUnlock = 10
      windowOpenStub = sinon.stub(window, 'open')
      windowOpenStub.returns(noop)

      addNewAccountStub = sinon.stub(metamaskController.keyringController, 'addNewAccount')
      addNewAccountStub.returns({})

      getAccountsStub = sinon.stub(metamaskController.keyringController, 'getAccounts')
      // Need to return different address to mock the behavior of
      // adding a new account from the keyring
      getAccountsStub.onCall(0).returns(Promise.resolve(['0x1']))
      getAccountsStub.onCall(1).returns(Promise.resolve(['0x2']))
      getAccountsStub.onCall(2).returns(Promise.resolve(['0x3']))
      getAccountsStub.onCall(3).returns(Promise.resolve(['0x4']))
      sinon.spy(metamaskController.preferencesController, 'setAddresses')
      sinon.spy(metamaskController.preferencesController, 'setSelectedAddress')
      sinon.spy(metamaskController.preferencesController, 'setAccountLabel')
      await metamaskController.connectHardware('trezor', 0, `m/44/0'/0'`).catch(() => null)
      await metamaskController.unlockHardwareWalletAccount(accountToUnlock, 'trezor', `m/44/0'/0'`)
    })

    afterEach(function () {
      window.open.restore()
      metamaskController.keyringController.addNewAccount.restore()
      metamaskController.keyringController.getAccounts.restore()
      metamaskController.preferencesController.setAddresses.restore()
      metamaskController.preferencesController.setSelectedAddress.restore()
      metamaskController.preferencesController.setAccountLabel.restore()
    })

    it('should set unlockedAccount in the keyring', async function () {
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Trezor Hardware'
      )
      assert.equal(keyrings[0].unlockedAccount, accountToUnlock)
    })


    it('should call keyringController.addNewAccount', async function () {
      assert(metamaskController.keyringController.addNewAccount.calledOnce)
    })

    it('should call keyringController.getAccounts ', async function () {
      assert(metamaskController.keyringController.getAccounts.called)
    })

    it('should call preferencesController.setAddresses', async function () {
      assert(metamaskController.preferencesController.setAddresses.calledOnce)
    })

    it('should call preferencesController.setSelectedAddress', async function () {
      assert(metamaskController.preferencesController.setSelectedAddress.calledOnce)
    })

    it('should call preferencesController.setAccountLabel', async function () {
      assert(metamaskController.preferencesController.setAccountLabel.calledOnce)
    })


  })

  describe('#setCustomRpc', function () {
    let rpcTarget

    beforeEach(function () {
      rpcTarget = metamaskController.setCustomRpc(CUSTOM_RPC_URL)
    })

    it('returns custom RPC that when called', async function () {
      assert.equal(await rpcTarget, CUSTOM_RPC_URL)
    })

    it('changes the network controller rpc', function () {
      const networkControllerState = metamaskController.networkController.store.getState()
      assert.equal(networkControllerState.provider.rpcTarget, CUSTOM_RPC_URL)
    })
  })

  describe('#setCurrentCurrency', function () {
    let defaultMetaMaskCurrency

    beforeEach(function () {
      defaultMetaMaskCurrency = metamaskController.currencyRateController.state.currentCurrency
    })

    it('defaults to usd', function () {
      assert.equal(defaultMetaMaskCurrency, 'usd')
    })

    it('sets currency to JPY', function () {
      metamaskController.setCurrentCurrency('JPY', noop)
      assert.equal(metamaskController.currencyRateController.state.currentCurrency, 'JPY')
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
      shapeShiftTxList = metamaskController.shapeshiftController.state.shapeShiftTxList
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
    it('errors when no keying is provided', async function () {
      try {
        await metamaskController.verifySeedPhrase()
      } catch (error) {
        assert.equal(error.message, 'MetamaskController - No HD Key Tree found')
      }
    })

    beforeEach(async function () {
      await metamaskController.createNewVaultAndKeychain('password')
    })

    it('#addNewAccount', async function () {
      await metamaskController.addNewAccount()
      const getAccounts = await metamaskController.keyringController.getAccounts()
      assert.equal(getAccounts.length, 2)
    })
  })

  describe('#resetAccount', function () {

    beforeEach(function () {
      const selectedAddressStub = sinon.stub(metamaskController.preferencesController, 'getSelectedAddress')
      const getNetworkstub = sinon.stub(metamaskController.txController.txStateManager, 'getNetwork')

      selectedAddressStub.returns('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
      getNetworkstub.returns(42)

      metamaskController.txController.txStateManager._saveTxList([
        createTxMeta({ id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'} }),
        createTxMeta({ id: 1, status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: {from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'} }),
        createTxMeta({ id: 2, status: 'rejected', metamaskNetworkId: 32 }),
        createTxMeta({ id: 3, status: 'submitted', metamaskNetworkId: currentNetworkId, txParams: {from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4'} }),
      ])
    })

    it('wipes transactions from only the correct network id and with the selected address', async function () {
      await metamaskController.resetAccount()
      assert.equal(metamaskController.txController.txStateManager.getTx(1), undefined)
    })
  })

  describe('#removeAccount', function () {
    let ret
    const addressToRemove = '0x1'

    beforeEach(async function () {
      sinon.stub(metamaskController.preferencesController, 'removeAddress')
      sinon.stub(metamaskController.accountTracker, 'removeAccount')
      sinon.stub(metamaskController.keyringController, 'removeAccount')

      ret = await metamaskController.removeAccount(addressToRemove)

    })

    afterEach(function () {
      metamaskController.keyringController.removeAccount.restore()
      metamaskController.accountTracker.removeAccount.restore()
      metamaskController.preferencesController.removeAddress.restore()
    })

    it('should call preferencesController.removeAddress', async function () {
      assert(metamaskController.preferencesController.removeAddress.calledWith(addressToRemove))
    })
    it('should call accountTracker.removeAccount', async function () {
      assert(metamaskController.accountTracker.removeAccount.calledWith([addressToRemove]))
    })
    it('should call keyringController.removeAccount', async function () {
      assert(metamaskController.keyringController.removeAccount.calledWith(addressToRemove))
    })
    it('should return address', async function () {
      assert.equal(ret, '0x1')
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

  describe('#newUnsignedMessage', () => {

    let msgParams, metamaskMsgs, messages, msgId

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'
    const data = '0x43727970746f6b697474696573'

    beforeEach(async () => {
      sandbox.stub(metamaskController, 'getBalance')
      metamaskController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)

      msgParams = {
        'from': address,
        'data': data,
      }

      const promise = metamaskController.newUnsignedMessage(msgParams)
      // handle the promise so it doesn't throw an unhandledRejection
      promise.then(noop).catch(noop)

      metamaskMsgs = metamaskController.messageManager.getUnapprovedMsgs()
      messages = metamaskController.messageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
      messages[0].msgParams.metamaskId = parseInt(msgId)
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

    it('errors when signing a message', async function () {
      try {
        await metamaskController.signMessage(messages[0].msgParams)
      } catch (error) {
        assert.equal(error.message, 'message length is invalid')
      }
    })
  })

  describe('#newUnsignedPersonalMessage', function () {
    let msgParams, metamaskPersonalMsgs, personalMessages, msgId

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'
    const data = '0x43727970746f6b697474696573'

    beforeEach(async function () {
      sandbox.stub(metamaskController, 'getBalance')
      metamaskController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)

      msgParams = {
        'from': address,
        'data': data,
      }

      const promise = metamaskController.newUnsignedPersonalMessage(msgParams)
      // handle the promise so it doesn't throw an unhandledRejection
      promise.then(noop).catch(noop)

      metamaskPersonalMsgs = metamaskController.personalMessageManager.getUnapprovedMsgs()
      personalMessages = metamaskController.personalMessageManager.messages
      msgId = Object.keys(metamaskPersonalMsgs)[0]
      personalMessages[0].msgParams.metamaskId = parseInt(msgId)
    })

    it('errors with no from in msgParams', async () => {
      const msgParams = {
        'data': data,
      }
      try {
        await metamaskController.newUnsignedPersonalMessage(msgParams)
        assert.fail('should have thrown')
      } catch (error) {
        assert.equal(error.message, 'MetaMask Message Signature: from field is required.')
      }
    })

    it('persists address from msg params', function () {
      assert.equal(metamaskPersonalMsgs[msgId].msgParams.from, address)
    })

    it('persists data from msg params', function () {
      assert.equal(metamaskPersonalMsgs[msgId].msgParams.data, data)
    })

    it('sets the status to unapproved', function () {
      assert.equal(metamaskPersonalMsgs[msgId].status, 'unapproved')
    })

    it('sets the type to personal_sign', function () {
      assert.equal(metamaskPersonalMsgs[msgId].type, 'personal_sign')
    })

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId)
      metamaskController.cancelPersonalMessage(msgIdInt, noop)
      assert.equal(personalMessages[0].status, 'rejected')
    })

    it('errors when signing a message', async function () {
      await metamaskController.signPersonalMessage(personalMessages[0].msgParams)
      assert.equal(metamaskPersonalMsgs[msgId].status, 'signed')
      assert.equal(metamaskPersonalMsgs[msgId].rawSig, '0x6a1b65e2b8ed53cf398a769fad24738f9fbe29841fe6854e226953542c4b6a173473cb152b6b1ae5f06d601d45dd699a129b0a8ca84e78b423031db5baa734741b')
    })
  })

  describe('#setupUntrustedCommunication', function () {
    let streamTest

    const phishingUrl = 'myethereumwalletntw.com'

    afterEach(function () {
      streamTest.end()
    })

    it('sets up phishing stream for untrusted communication ', async () => {
      await metamaskController.phishingController.updatePhishingLists()

      const { promise, resolve } = deferredPromise()

      streamTest = createThoughStream((chunk, _, cb) => {
        if (chunk.name !== 'phishing') return cb()
        assert.equal(chunk.data.hostname, phishingUrl)
        resolve()
        cb()
      })
      metamaskController.setupUntrustedCommunication(streamTest, phishingUrl)

      await promise
    })
  })

  describe('#setupTrustedCommunication', function () {
    let streamTest

    afterEach(function () {
      streamTest.end()
    })

    it('sets up controller dnode api for trusted communication', function (done) {
      streamTest = createThoughStream((chunk, _, cb) => {
        assert.equal(chunk.name, 'controller')
        cb()
        done()
      })

      metamaskController.setupTrustedCommunication(streamTest, 'mycrypto.com')
    })
  })

  describe('#markPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to true', function () {
      metamaskController.markPasswordForgotten(noop)
      const state = metamaskController.getState()
      assert.equal(state.forgottenPassword, true)
    })
  })

  describe('#unMarkPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to false', function () {
      metamaskController.unMarkPasswordForgotten(noop)
      const state = metamaskController.getState()
      assert.equal(state.forgottenPassword, false)
    })
  })

  describe('#_onKeyringControllerUpdate', function () {
    it('should do nothing if there are no keyrings in state', async function () {
      const addAddresses = sinon.fake()
      const syncWithAddresses = sinon.fake()
      sandbox.replace(metamaskController, 'preferencesController', {
        addAddresses,
      })
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      })

      const oldState = metamaskController.getState()
      await metamaskController._onKeyringControllerUpdate({keyrings: []})

      assert.ok(addAddresses.notCalled)
      assert.ok(syncWithAddresses.notCalled)
      assert.deepEqual(metamaskController.getState(), oldState)
    })

    it('should update selected address if keyrings was locked', async function () {
      const addAddresses = sinon.fake()
      const getSelectedAddress = sinon.fake.returns('0x42')
      const setSelectedAddress = sinon.fake()
      const syncWithAddresses = sinon.fake()
      sandbox.replace(metamaskController, 'preferencesController', {
        addAddresses,
        getSelectedAddress,
        setSelectedAddress,
      })
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      })

      const oldState = metamaskController.getState()
      await metamaskController._onKeyringControllerUpdate({
        isUnlocked: false,
        keyrings: [{
          accounts: ['0x1', '0x2'],
        }],
      })

      assert.deepEqual(addAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(syncWithAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(setSelectedAddress.args, [['0x1']])
      assert.deepEqual(metamaskController.getState(), oldState)
    })

    it('should NOT update selected address if already unlocked', async function () {
      const addAddresses = sinon.fake()
      const syncWithAddresses = sinon.fake()
      sandbox.replace(metamaskController, 'preferencesController', {
        addAddresses,
      })
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      })

      const oldState = metamaskController.getState()
      await metamaskController._onKeyringControllerUpdate({
        isUnlocked: true,
        keyrings: [{
          accounts: ['0x1', '0x2'],
        }],
      })

      assert.deepEqual(addAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(syncWithAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(metamaskController.getState(), oldState)
    })
  })

})

function deferredPromise () {
  let resolve
  const promise = new Promise(_resolve => { resolve = _resolve })
  return { promise, resolve }
}
