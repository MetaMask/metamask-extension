import assert from 'assert'
import sinon from 'sinon'
import { cloneDeep } from 'lodash'
import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import EthQuery from 'eth-query'
import Eth from 'ethjs'
import KeyringController from 'eth-keyring-controller'
import { createTestProviderTools } from '../../../stub/provider'
import enLocale from '../../../../app/_locales/en/messages.json'
import * as actions from '../../../../ui/app/store/actions'
import MetaMaskController from '../../../../app/scripts/metamask-controller'
import firstTimeState from '../../localhostState'
import devState from '../../../data/2-state.json'

const provider = createTestProviderTools({ scaffold: {} }).provider
const middleware = [thunk]
const mockStore = configureStore(middleware)

describe('Actions', function () {

  const noop = () => {}

  const currentNetworkId = 42

  let background, metamaskController

  const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
  const password = 'a-fake-password'
  const importPrivkey = '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553'

  beforeEach(async function () {

    metamaskController = new MetaMaskController({
      provider,
      keyringController: new KeyringController({}),
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
      initState: cloneDeep(firstTimeState),
    })

    metamaskController.threeBoxController = {
      new3Box: sinon.spy(),
      getThreeBoxSyncingState: sinon.spy(),
    }

    await metamaskController.createNewVaultAndRestore(password, TEST_SEED)

    await metamaskController.importAccountWithStrategy('Private Key', [ importPrivkey ])

    background = metamaskController.getApi()

    actions._setBackgroundConnection(background)

    global.ethQuery = new EthQuery(provider)
  })

  describe('#tryUnlockMetamask', function () {

    let submitPasswordSpy, verifySeedPhraseSpy

    afterEach(function () {
      submitPasswordSpy.restore()
      verifySeedPhraseSpy.restore()
    })

    it('calls submitPassword and verifySeedPhrase', async function () {

      const store = mockStore({})

      submitPasswordSpy = sinon.spy(background, 'submitPassword')
      verifySeedPhraseSpy = sinon.spy(background, 'verifySeedPhrase')

      await store.dispatch(actions.tryUnlockMetamask())
      assert(submitPasswordSpy.calledOnce)
      assert(verifySeedPhraseSpy.calledOnce)
    })

    it('errors on submitPassword will fail', async function () {

      const store = mockStore({})

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UNLOCK_IN_PROGRESS' },
        { type: 'UNLOCK_FAILED', value: 'error in submitPassword' },
        { type: 'HIDE_LOADING_INDICATION' },
      ]


      submitPasswordSpy = sinon.stub(background, 'submitPassword')

      submitPasswordSpy.callsFake((_, callback) => {
        callback(new Error('error in submitPassword'))
      })

      try {
        await store.dispatch(actions.tryUnlockMetamask('test'))
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })

    it('displays warning error and unlock failed when verifySeed fails', async function () {
      const store = mockStore({})
      const displayWarningError = [ { type: 'DISPLAY_WARNING', value: 'error' } ]
      const unlockFailedError = [ { type: 'UNLOCK_FAILED', value: 'error' } ]

      verifySeedPhraseSpy = sinon.stub(background, 'verifySeedPhrase')
      verifySeedPhraseSpy.callsFake((callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.tryUnlockMetamask('test'))
        assert.fail('Should have thrown error')
      } catch (_) {
        const actions1 = store.getActions()
        const warning = actions1.filter((action) => action.type === 'DISPLAY_WARNING')
        const unlockFailed = actions1.filter((action) => action.type === 'UNLOCK_FAILED')
        assert.deepEqual(warning, displayWarningError)
        assert.deepEqual(unlockFailed, unlockFailedError)
      }
    })
  })

  describe('#createNewVaultAndRestore', function () {

    let createNewVaultAndRestoreSpy

    afterEach(function () {
      createNewVaultAndRestoreSpy.restore()
    })

    it('restores new vault', async function () {

      const store = mockStore({})

      createNewVaultAndRestoreSpy = sinon.spy(background, 'createNewVaultAndRestore')

      try {
        await store.dispatch(actions.createNewVaultAndRestore())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert(createNewVaultAndRestoreSpy.calledOnce)
      }
    })

    it('errors when callback in createNewVaultAndRestore throws', async function () {
      const store = mockStore({})

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
      ]

      createNewVaultAndRestoreSpy = sinon.stub(background, 'createNewVaultAndRestore')

      createNewVaultAndRestoreSpy.callsFake((_, __, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.createNewVaultAndRestore())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#requestRevealSeedWords', function () {
    let submitPasswordSpy

    afterEach(function () {
      submitPasswordSpy.restore()
    })

    it('calls submitPassword in background', async function () {
      const store = mockStore()

      submitPasswordSpy = sinon.spy(background, 'verifySeedPhrase')

      await store.dispatch(actions.requestRevealSeedWords())
      assert(submitPasswordSpy.calledOnce)
    })

    it('displays warning error message then callback in background errors', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      submitPasswordSpy = sinon.stub(background, 'verifySeedPhrase')
      submitPasswordSpy.callsFake((callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.requestRevealSeedWords())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }

    })
  })

  describe('#removeAccount', function () {
    let removeAccountSpy

    afterEach(function () {
      removeAccountSpy.restore()
    })

    it('calls removeAccount in background and expect actions to show account', async function () {
      const store = mockStore(devState)

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'UPDATE_METAMASK_STATE',
        'HIDE_LOADING_INDICATION',
        'SHOW_ACCOUNTS_PAGE',
      ]

      removeAccountSpy = sinon.spy(background, 'removeAccount')

      await store.dispatch(actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'))
      assert(removeAccountSpy.calledOnce)
      const actionTypes = store
        .getActions()
        .map((action) => action.type)
      assert.deepEqual(actionTypes, expectedActions)
    })

    it('displays warning error message when removeAccount callback errors', async function () {
      const store = mockStore()

      const expectedActions = [
        'SHOW_LOADING_INDICATION',
        'DISPLAY_WARNING',
        'HIDE_LOADING_INDICATION',
      ]

      removeAccountSpy = sinon.stub(background, 'removeAccount')
      removeAccountSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'))
        assert.fail('Should have thrown error')
      } catch (_) {
        const actionTypes = store
          .getActions()
          .map((action) => action.type)
        assert.deepEqual(actionTypes, expectedActions)
      }

    })
  })

  describe('#addNewKeyring', function () {
    let addNewKeyringSpy

    beforeEach(function () {
      addNewKeyringSpy = sinon.stub(background, 'addNewKeyring')
    })

    afterEach(function () {
      addNewKeyringSpy.restore()
    })

    it('calls addNewKeyring', function () {
      const privateKey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'

      const store = mockStore()
      store.dispatch(actions.addNewKeyring('Simple Key Pair', [ privateKey ]))
      assert(addNewKeyringSpy.calledOnce)
    })

    it('errors then addNewKeyring in background throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      addNewKeyringSpy.callsFake((_, __, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.addNewKeyring())
      assert.deepEqual(store.getActions(), expectedActions)
    })

  })

  describe('#resetAccount', function () {

    let resetAccountSpy

    afterEach(function () {
      resetAccountSpy.restore()
    })

    it('resets account', async function () {

      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_ACCOUNTS_PAGE' },
      ]

      resetAccountSpy = sinon.spy(background, 'resetAccount')

      await store.dispatch(actions.resetAccount())
      assert(resetAccountSpy.calledOnce)
      assert.deepEqual(store.getActions(), expectedActions)
    })

    it('throws if resetAccount throws', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      resetAccountSpy = sinon.stub(background, 'resetAccount')
      resetAccountSpy.callsFake((callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.resetAccount())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#importNewAccount', function () {

    let importAccountWithStrategySpy

    afterEach(function () {
      importAccountWithStrategySpy.restore()
    })

    it('calls importAccountWithStrategies in background', function () {
      const store = mockStore()

      importAccountWithStrategySpy = sinon.spy(background, 'importAccountWithStrategy')

      const importPrivkey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'

      store.dispatch(actions.importNewAccount('Private Key', [ importPrivkey ]))
      assert(importAccountWithStrategySpy.calledOnce)
    })

    it('displays warning error message when importAccount in background callback errors', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: 'This may take a while, please be patient.' },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      importAccountWithStrategySpy = sinon.stub(background, 'importAccountWithStrategy')
      importAccountWithStrategySpy.callsFake((_, __, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.importNewAccount())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#addNewAccount', function () {

    it('Adds a new account', function () {
      const store = mockStore({ metamask: devState })

      const addNewAccountSpy = sinon.spy(background, 'addNewAccount')

      store.dispatch(actions.addNewAccount())
      assert(addNewAccountSpy.calledOnce)
    })

  })

  describe('#checkHardwareStatus', function () {

    let checkHardwareStatusSpy

    beforeEach(function () {
      checkHardwareStatusSpy = sinon.stub(background, 'checkHardwareStatus')
    })

    afterEach(function () {
      checkHardwareStatusSpy.restore()
    })

    it('calls checkHardwareStatus in background', async function () {

      const store = mockStore()

      store.dispatch(await actions.checkHardwareStatus('ledger', `m/44'/60'/0'/0`))
      assert.equal(checkHardwareStatusSpy.calledOnce, true)
    })

    it('shows loading indicator and displays error', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      checkHardwareStatusSpy.callsFake((_, __, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.checkHardwareStatus())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#forgetDevice', function () {

    let forgetDeviceSpy

    beforeEach(function () {
      forgetDeviceSpy = sinon.stub(background, 'forgetDevice')
    })

    afterEach(function () {
      forgetDeviceSpy.restore()
    })

    it('calls forgetDevice in background', function () {

      const store = mockStore()

      store.dispatch(actions.forgetDevice('ledger'))
      assert.equal(forgetDeviceSpy.calledOnce, true)

    })

    it('shows loading indicator and displays error', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      forgetDeviceSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.forgetDevice())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#connectHardware', function () {

    let connectHardwareSpy

    beforeEach(function () {
      connectHardwareSpy = sinon.stub(background, 'connectHardware')
    })

    afterEach(function () {
      connectHardwareSpy.restore()
    })

    it('calls connectHardware in background', function () {

      const store = mockStore()

      store.dispatch(actions.connectHardware('ledger', 0, `m/44'/60'/0'/0`))
      assert.equal(connectHardwareSpy.calledOnce, true)

    })

    it('shows loading indicator and displays error', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      connectHardwareSpy.callsFake((_, __, ___, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.connectHardware())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#unlockHardwareWalletAccount', function () {

    let unlockHardwareWalletAccountSpy

    beforeEach(function () {
      unlockHardwareWalletAccountSpy = sinon.stub(background, 'unlockHardwareWalletAccount')
    })

    afterEach(function () {
      unlockHardwareWalletAccountSpy.restore()
    })

    it('calls unlockHardwareWalletAccount in background', function () {

      const store = mockStore()

      store.dispatch(actions.unlockHardwareWalletAccount('ledger', 0, `m/44'/60'/0'/0`))
      assert.equal(unlockHardwareWalletAccountSpy.calledOnce, true)

    })

    it('shows loading indicator and displays error', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      unlockHardwareWalletAccountSpy.callsFake((_, __, ___, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.unlockHardwareWalletAccount())
        assert.fail('Should have thrown error')
      } catch (error) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#setCurrentCurrency', function () {

    let setCurrentCurrencySpy

    beforeEach(function () {
      setCurrentCurrencySpy = sinon.stub(background, 'setCurrentCurrency')
    })

    afterEach(function () {
      setCurrentCurrencySpy.restore()
    })

    it('calls setCurrentCurrency', function () {
      const store = mockStore()

      store.dispatch(actions.setCurrentCurrency('jpy'))
      assert(setCurrentCurrencySpy.calledOnce)
    })

    it('throws if setCurrentCurrency throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]
      setCurrentCurrencySpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.setCurrentCurrency())
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#signMsg', function () {

    let signMessageSpy, metamaskMsgs, msgId, messages

    const msgParams = {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    }

    beforeEach(function () {
      metamaskController.newUnsignedMessage(msgParams, noop)
      metamaskMsgs = metamaskController.messageManager.getUnapprovedMsgs()
      messages = metamaskController.messageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
      messages[0].msgParams.metamaskId = parseInt(msgId)
    })

    afterEach(function () {
      signMessageSpy.restore()
    })

    it('calls signMsg in background', function () {
      const store = mockStore({
        metamask: {},
      })

      signMessageSpy = sinon.spy(background, 'signMessage')
      store.dispatch(actions.signMsg(msgParams))
      assert(signMessageSpy.calledOnce)

    })

    it('errors when signMessage in background throws', async function () {
      const store = mockStore({
        metamask: {},
      })
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UPDATE_METAMASK_STATE', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      signMessageSpy = sinon.stub(background, 'signMessage')
      signMessageSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.signMsg())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })

  })

  describe('#signPersonalMsg', function () {

    let signPersonalMessageSpy, metamaskMsgs, msgId, personalMessages

    const msgParams = {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    }

    beforeEach(function () {
      metamaskController.newUnsignedPersonalMessage(msgParams, noop)
      metamaskMsgs = metamaskController.personalMessageManager.getUnapprovedMsgs()
      personalMessages = metamaskController.personalMessageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
      personalMessages[0].msgParams.metamaskId = parseInt(msgId)
    })

    afterEach(function () {
      signPersonalMessageSpy.restore()
    })

    it('calls signPersonalMessage', function () {
      const store = mockStore({
        metamask: {},
      })

      signPersonalMessageSpy = sinon.spy(background, 'signPersonalMessage')

      store.dispatch(actions.signPersonalMsg(msgParams))
      assert(signPersonalMessageSpy.calledOnce)

    })

    it('throws if signPersonalMessage throws', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UPDATE_METAMASK_STATE', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      signPersonalMessageSpy = sinon.stub(background, 'signPersonalMessage')
      signPersonalMessageSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.signPersonalMsg(msgParams))
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })

  })

  describe('#signTypedMsg', function () {
    let signTypedMsgSpy, messages, typedMessages, msgId

    const msgParamsV3 = {
      from: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
      data: JSON.stringify({
        'types': {
          'EIP712Domain': [
            { 'name': 'name', 'type': 'string' },
            { 'name': 'version', 'type': 'string' },
            { 'name': 'chainId', 'type': 'uint256' },
            { 'name': 'verifyingContract', 'type': 'address' },
          ],
          'Person': [
            { 'name': 'name', 'type': 'string' },
            { 'name': 'wallet', 'type': 'address' },
          ],
          'Mail': [
            { 'name': 'from', 'type': 'Person' },
            { 'name': 'to', 'type': 'Person' },
            { 'name': 'contents', 'type': 'string' },
          ],
        },
        'primaryType': 'Mail',
        'domain': {
          'name': 'Ether Mainl',
          'version': '1',
          'verifyingContract': '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        'message': {
          'from': {
            'name': 'Cow',
            'wallet': '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          'to': {
            'name': 'Bob',
            'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          'contents': 'Hello, Bob!',
        },
      }),
    }

    beforeEach(function () {
      metamaskController.newUnsignedTypedMessage(msgParamsV3, null, 'V3')
      messages = metamaskController.typedMessageManager.getUnapprovedMsgs()
      typedMessages = metamaskController.typedMessageManager.messages
      msgId = Object.keys(messages)[0]
      typedMessages[0].msgParams.metamaskId = parseInt(msgId)
      signTypedMsgSpy = sinon.stub(background, 'signTypedMessage')
    })

    afterEach(function () {
      signTypedMsgSpy.restore()
    })

    it('calls signTypedMsg in background with no error', function () {
      const store = mockStore()

      store.dispatch(actions.signTypedMsg(msgParamsV3))
      assert(signTypedMsgSpy.calledOnce)
    })

    it('returns expected actions with error', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'UPDATE_METAMASK_STATE', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      signTypedMsgSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.signTypedMsg())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })

  })

  describe('#signTx', function () {

    let sendTransactionSpy

    beforeEach(function () {
      sendTransactionSpy = sinon.stub(global.ethQuery, 'sendTransaction')
    })

    afterEach(function () {
      sendTransactionSpy.restore()
    })

    it('calls sendTransaction in global ethQuery', function () {
      const store = mockStore()

      store.dispatch(actions.signTx())
      assert(sendTransactionSpy.calledOnce)
    })

    it('errors in when sendTransaction throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'SHOW_CONF_TX_PAGE', transForward: true, id: undefined },
      ]
      sendTransactionSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.signTx())
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#updatedGasData', function () {
    it('errors when get code does not return', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'GAS_LOADING_STARTED' },
        { type: 'UPDATE_SEND_ERRORS', value: { gasLoadingError: 'gasLoadingError' } },
        { type: 'GAS_LOADING_FINISHED' },
      ]

      const mockData = {
        gasPrice: '0x3b9aca00', //
        blockGasLimit: '0x6ad79a', // 7002010
        selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
        to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
        value: '0xde0b6b3a7640000', // 1000000000000000000
      }

      try {
        await store.dispatch(actions.updateGasData(mockData))
        assert.fail('Should have thrown error')
      } catch (error) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })

    it('returns default gas limit for basic eth transaction', async function () {
      const mockData = {
        gasPrice: '0x3b9aca00',
        blockGasLimit: '0x6ad79a', // 7002010
        selectedAddress: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
        to: '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B',
        value: '0xde0b6b3a7640000', // 1000000000000000000
      }

      global.eth = {
        getCode: sinon.stub().returns('0x'),
      }
      const store = mockStore()

      const expectedActions = [
        { type: 'GAS_LOADING_STARTED' },
        { type: 'UPDATE_GAS_LIMIT', value: '0x5208' },
        { type: 'metamask/gas/SET_CUSTOM_GAS_LIMIT', value: '0x5208' },
        { type: 'UPDATE_SEND_ERRORS', value: { gasLoadingError: null } },
        { type: 'GAS_LOADING_FINISHED' },
      ]

      await store.dispatch(actions.updateGasData(mockData))
      assert.deepEqual(store.getActions(), expectedActions)
      global.eth.getCode.reset()
    })
  })

  describe('#signTokenTx', function () {
    it('calls eth.contract', function () {
      global.eth = new Eth(provider)
      const tokenSpy = sinon.spy(global.eth, 'contract')
      const store = mockStore()
      store.dispatch(actions.signTokenTx())
      assert(tokenSpy.calledOnce)
      tokenSpy.restore()
    })
  })

  describe('#updateTransaction', function () {

    let updateTransactionSpy

    const txParams = {
      'from': '0x1',
      'gas': '0x5208',
      'gasPrice': '0x3b9aca00',
      'to': '0x2',
      'value': '0x0',
    }

    const txData = { id: '1', status: 'unapproved', metamaskNetworkId: currentNetworkId, txParams: txParams }

    beforeEach(async function () {
      await metamaskController.txController.txStateManager.addTx(txData)
    })

    afterEach(function () {
      updateTransactionSpy.restore()
    })

    it('updates transaction', async function () {
      const store = mockStore()

      updateTransactionSpy = sinon.spy(background, 'updateTransaction')

      await store.dispatch(actions.updateTransaction(txData))

      const resultantActions = store.getActions()
      assert.ok(updateTransactionSpy.calledOnce)
      assert.deepEqual(resultantActions[1], { type: 'UPDATE_TRANSACTION_PARAMS', id: txData.id, value: txParams })
    })

    it('rejects with error message', async function () {
      const store = mockStore()

      updateTransactionSpy = sinon.stub(background, 'updateTransaction')
      updateTransactionSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.updateTransaction(txData))
        assert.fail('Should have thrown error')
      } catch (error) {
        assert.equal(error.message, 'error')
      }
    })
  })

  describe('#lockMetamask', function () {
    let backgroundSetLockedSpy

    afterEach(function () {
      backgroundSetLockedSpy.restore()
    })

    it('calls setLocked', async function () {
      const store = mockStore()

      backgroundSetLockedSpy = sinon.spy(background, 'setLocked')

      await store.dispatch(actions.lockMetamask())
      assert(backgroundSetLockedSpy.calledOnce)
    })

    it('returns display warning error with value when setLocked in background callback errors', async function () {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'LOCK_METAMASK' },
      ]
      backgroundSetLockedSpy = sinon.stub(background, 'setLocked')
      backgroundSetLockedSpy.callsFake((callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.lockMetamask())
        assert.fail('Should have thrown error')
      } catch (error) {
        assert.deepEqual(store.getActions(), expectedActions)
      }

    })
  })

  describe('#setSelectedAddress', function () {
    let setSelectedAddressSpy

    beforeEach(function () {
      setSelectedAddressSpy = sinon.stub(background, 'setSelectedAddress')
    })

    afterEach(function () {
      setSelectedAddressSpy.restore()
    })

    it('calls setSelectedAddress in background', function () {
      const store = mockStore({ metamask: devState })

      store.dispatch(actions.setSelectedAddress('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'))
      assert(setSelectedAddressSpy.calledOnce)
    })

    it('errors when setSelectedAddress throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      setSelectedAddressSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.setSelectedAddress())
      assert.deepEqual(store.getActions(), expectedActions)

    })
  })

  describe('#showAccountDetail', function () {
    let setSelectedAddressSpy

    beforeEach(function () {
      setSelectedAddressSpy = sinon.stub(background, 'setSelectedAddress')
    })

    afterEach(function () {
      setSelectedAddressSpy.restore()
    })

    it('#showAccountDetail', function () {
      const store = mockStore()

      store.dispatch(actions.showAccountDetail())
      assert(setSelectedAddressSpy.calledOnce)
    })

    it('displays warning if setSelectedAddress throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]
      setSelectedAddressSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.showAccountDetail())
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#addToken', function () {
    let addTokenSpy

    beforeEach(function () {
      addTokenSpy = sinon.stub(background, 'addToken')
    })

    afterEach(function () {
      addTokenSpy.restore()
    })

    it('calls addToken in background', async function () {
      const store = mockStore()

      store.dispatch(actions.addToken())
      assert(addTokenSpy.calledOnce)
    })

    it('errors when addToken in background throws', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      addTokenSpy.callsFake((_, __, ___, ____, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.addToken())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#removeToken', function () {

    let removeTokenSpy

    beforeEach(function () {
      removeTokenSpy = sinon.stub(background, 'removeToken')
    })

    afterEach(function () {
      removeTokenSpy.restore()
    })

    it('calls removeToken in background', async function () {
      const store = mockStore()
      store.dispatch(await actions.removeToken())
      assert(removeTokenSpy.calledOnce)
    })

    it('errors when removeToken in background fails', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      removeTokenSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.removeToken())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#setProviderType', function () {
    let setProviderTypeSpy
    let store

    beforeEach(function () {
      store = mockStore({ metamask: { provider: {} } })
      setProviderTypeSpy = sinon.stub(background, 'setProviderType')
    })

    afterEach(function () {
      setProviderTypeSpy.restore()
    })

    it('calls setProviderType', function () {
      store.dispatch(actions.setProviderType())
      assert(setProviderTypeSpy.calledOnce)
    })

    it('displays warning when setProviderType throws', function () {
      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'Had a problem changing networks!' },
      ]

      setProviderTypeSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.setProviderType())
      assert(setProviderTypeSpy.calledOnce)
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#setRpcTarget', function () {
    let setRpcTargetSpy

    beforeEach(function () {
      setRpcTargetSpy = sinon.stub(background, 'setCustomRpc')
    })

    afterEach(function () {
      setRpcTargetSpy.restore()
    })

    it('calls setRpcTarget', function () {
      const store = mockStore()
      store.dispatch(actions.setRpcTarget('http://localhost:8545'))
      assert(setRpcTargetSpy.calledOnce)
    })

    it('displays warning when setRpcTarget throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'Had a problem changing networks!' },
      ]

      setRpcTargetSpy.callsFake((_, __, ___, ____, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.setRpcTarget())
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#addToAddressBook', function () {
    it('calls setAddressBook', function () {
      const addToAddressBookSpy = sinon.stub(background, 'setAddressBook')
      const store = mockStore({ metamask: devState })
      store.dispatch(actions.addToAddressBook('test'))
      assert(addToAddressBookSpy.calledOnce)
      addToAddressBookSpy.restore()
    })
  })

  describe('#exportAccount', function () {
    let submitPasswordSpy, exportAccountSpy

    afterEach(function () {
      submitPasswordSpy.restore()
      exportAccountSpy.restore()
    })

    it('returns expected actions for successful action', async function () {
      const store = mockStore(devState)
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_PRIVATE_KEY', value: '7ec73b91bb20f209a7ff2d32f542c3420b4fccf14abcc7840d2eff0ebcb18505' },
      ]

      submitPasswordSpy = sinon.spy(background, 'submitPassword')
      exportAccountSpy = sinon.spy(background, 'exportAccount')

      await store.dispatch(actions.exportAccount(password, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'))
      assert(submitPasswordSpy.calledOnce)
      assert(exportAccountSpy.calledOnce)
      assert.deepEqual(store.getActions(), expectedActions)
    })

    it('returns action errors when first func callback errors', async function () {
      const store = mockStore(devState)
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'Incorrect Password.' },
      ]

      submitPasswordSpy = sinon.stub(background, 'submitPassword')
      submitPasswordSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.exportAccount(password, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'))
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })

    it('returns action errors when second func callback errors', async function () {
      const store = mockStore(devState)
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'Had a problem exporting the account.' },
      ]

      exportAccountSpy = sinon.stub(background, 'exportAccount')
      exportAccountSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.exportAccount(password, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'))
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#setAccountLabel', function () {
    it('calls setAccountLabel', function () {
      const setAccountLabelSpy = sinon.stub(background, 'setAccountLabel')
      const store = mockStore()
      store.dispatch(actions.setAccountLabel('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc', 'test'))
      assert(setAccountLabelSpy.calledOnce)
    })
  })

  describe('#setFeatureFlag', function () {
    let setFeatureFlagSpy

    beforeEach(function () {
      setFeatureFlagSpy = sinon.stub(background, 'setFeatureFlag')
    })

    afterEach(function () {
      setFeatureFlagSpy.restore()
    })

    it('calls setFeatureFlag in the background', function () {
      const store = mockStore()

      store.dispatch(actions.setFeatureFlag())
      assert(setFeatureFlagSpy.calledOnce)
    })

    it('errors when setFeatureFlag in background throws', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      setFeatureFlagSpy.callsFake((_, __, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.setFeatureFlag())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#setCompletedOnboarding', function () {
    it('completes onboarding', async function () {
      const completeOnboardingSpy = sinon.stub(background, 'completeOnboarding')
      completeOnboardingSpy.callsFake((cb) => cb())
      const store = mockStore()
      await store.dispatch(actions.setCompletedOnboarding())
      assert.equal(completeOnboardingSpy.callCount, 1)
      completeOnboardingSpy.restore()
    })
  })

  describe('#updateNetworkNonce', function () {
    let getTransactionCountSpy

    afterEach(function () {
      getTransactionCountSpy.restore()
    })

    it('calls getTransactionCount', function () {
      const store = mockStore()
      getTransactionCountSpy = sinon.spy(global.ethQuery, 'getTransactionCount')

      store.dispatch(actions.updateNetworkNonce())
      assert(getTransactionCountSpy.calledOnce)
    })

    it('errors when getTransactionCount throws', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]

      getTransactionCountSpy = sinon.stub(global.ethQuery, 'getTransactionCount')
      getTransactionCountSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.updateNetworkNonce())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }
    })
  })

  describe('#setUseBlockie', function () {
    let setUseBlockieSpy

    beforeEach(function () {
      setUseBlockieSpy = sinon.stub(background, 'setUseBlockie')
    })

    afterEach(function () {
      setUseBlockieSpy.restore()
    })

    it('calls setUseBlockie in background', function () {
      const store = mockStore()

      store.dispatch(actions.setUseBlockie())
      assert(setUseBlockieSpy.calledOnce)
    })

    it('errors when setUseBlockie in background throws', function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'SET_USE_BLOCKIE', value: undefined },
      ]

      setUseBlockieSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      store.dispatch(actions.setUseBlockie())
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#updateCurrentLocale', function () {
    let setCurrentLocaleSpy

    beforeEach(function () {
      sinon.stub(global, 'fetch')
        .resolves({
          json: async () => enLocale,
        })
    })

    afterEach(function () {
      setCurrentLocaleSpy.restore()
      global.fetch.restore()
    })

    it('calls expected actions', async function () {
      const store = mockStore()
      setCurrentLocaleSpy = sinon.spy(background, 'setCurrentLocale')

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'SET_CURRENT_LOCALE', value: { locale: 'en', messages: enLocale } },
        { type: 'HIDE_LOADING_INDICATION' },
      ]

      await store.dispatch(actions.updateCurrentLocale('en'))
      assert(setCurrentLocaleSpy.calledOnce)
      assert.deepEqual(store.getActions(), expectedActions)
    })

    it('errors when setCurrentLocale throws', async function () {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]
      setCurrentLocaleSpy = sinon.stub(background, 'setCurrentLocale')
      setCurrentLocaleSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.updateCurrentLocale('en'))
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }

    })
  })

  describe('#markPasswordForgotten', function () {
    it('calls markPasswordForgotten', function () {
      const store = mockStore()
      const markPasswordForgottenSpy = sinon.stub(background, 'markPasswordForgotten').callsArg(0)

      store.dispatch(actions.markPasswordForgotten())

      const resultantActions = store.getActions()
      assert.deepEqual(resultantActions[1], { type: 'FORGOT_PASSWORD', value: true })
      assert.ok(markPasswordForgottenSpy.calledOnce)
      markPasswordForgottenSpy.restore()
    })
  })

  describe('#unMarkPasswordForgotten', function () {
    it('calls unMarkPasswordForgotten', async function () {
      const store = mockStore()
      const unMarkPasswordForgottenSpy = sinon.stub(background, 'unMarkPasswordForgotten').callsArg(0)

      await store.dispatch(actions.unMarkPasswordForgotten())

      const resultantActions = store.getActions()
      assert.deepEqual(resultantActions[0], { type: 'FORGOT_PASSWORD', value: false })
      assert.ok(unMarkPasswordForgottenSpy.calledOnce)
      unMarkPasswordForgottenSpy.restore()
    })
  })
})
