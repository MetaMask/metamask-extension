// Used to inspect long objects
// util.inspect({JSON}, false, null))
// const util = require('util')
const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const nock = require('nock')
const fetchMock = require('fetch-mock')
const configureStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default
const EthQuery = require('eth-query')
const Eth = require('ethjs')
const KeyringController = require('eth-keyring-controller')

const { createTestProviderTools } = require('../../../stub/provider')
const provider = createTestProviderTools({ scaffold: {}}).provider

const enLocale = require('../../../../app/_locales/en/messages.json')
const actions = require('../../../../ui/app/store/actions')
const MetaMaskController = require('../../../../app/scripts/metamask-controller')

const firstTimeState = require('../../../unit/localhostState')
const devState = require('../../../data/2-state.json')

const middleware = [thunk]
const mockStore = configureStore(middleware)

describe('Actions', () => {

  const noop = () => {}

  let background, metamaskController

  const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
  const password = 'a-fake-password'
  const importPrivkey = '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553'

  beforeEach(async () => {


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
      initState: clone(firstTimeState),
    })

    metamaskController.threeBoxController = {
      new3Box: sinon.spy(),
      getThreeBoxAddress: sinon.spy(),
      getThreeBoxSyncingState: sinon.spy(),
    }

    await metamaskController.createNewVaultAndRestore(password, TEST_SEED)

    await metamaskController.importAccountWithStrategy('Private Key', [ importPrivkey ])

    background = metamaskController.getApi()

    actions._setBackgroundConnection(background)

    global.ethQuery = new EthQuery(provider)
  })

  describe('#tryUnlockMetamask', () => {

    let submitPasswordSpy, verifySeedPhraseSpy

    afterEach(() => {
      submitPasswordSpy.restore()
      verifySeedPhraseSpy.restore()
    })

    it('calls submitPassword and verifySeedPhrase', async () => {

      const store = mockStore({})

      submitPasswordSpy = sinon.spy(background, 'submitPassword')
      verifySeedPhraseSpy = sinon.spy(background, 'verifySeedPhrase')

      return store.dispatch(actions.tryUnlockMetamask())
        .then(() => {
          assert(submitPasswordSpy.calledOnce)
          assert(verifySeedPhraseSpy.calledOnce)
        })
    })

    it('errors on submitPassword will fail', async () => {

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

    it('displays warning error and unlock failed when verifySeed fails', async () => {
      const store = mockStore({})
      const displayWarningError = [ { type: 'DISPLAY_WARNING', value: 'error' } ]
      const unlockFailedError = [ { type: 'UNLOCK_FAILED', value: 'error' } ]

      verifySeedPhraseSpy = sinon.stub(background, 'verifySeedPhrase')
      verifySeedPhraseSpy.callsFake(callback => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.tryUnlockMetamask('test'))
        assert.fail('Should have thrown error')
      } catch (_) {
        const actions = store.getActions()
        const warning = actions.filter(action => action.type === 'DISPLAY_WARNING')
        const unlockFailed = actions.filter(action => action.type === 'UNLOCK_FAILED')
        assert.deepEqual(warning, displayWarningError)
        assert.deepEqual(unlockFailed, unlockFailedError)
      }
    })
  })

  describe('#createNewVaultAndRestore', () => {

    let createNewVaultAndRestoreSpy

    afterEach(() => {
      createNewVaultAndRestoreSpy.restore()
    })

    it('restores new vault', async () => {

      const store = mockStore({})

      createNewVaultAndRestoreSpy = sinon.spy(background, 'createNewVaultAndRestore')

      try {
        await store.dispatch(actions.createNewVaultAndRestore())
        assert.fail('Should have thrown error')
      } catch (_) {
        assert(createNewVaultAndRestoreSpy.calledOnce)
      }
    })

    it('errors when callback in createNewVaultAndRestore throws', async () => {
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

  describe('#requestRevealSeedWords', () => {
    let submitPasswordSpy

    it('calls submitPassword in background', () => {
      const store = mockStore()

      submitPasswordSpy = sinon.spy(background, 'verifySeedPhrase')

      return store.dispatch(actions.requestRevealSeedWords())
        .then(() => {
          assert(submitPasswordSpy.calledOnce)
        })
    })

    it('displays warning error message then callback in background errors', async () => {
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

  describe('#removeAccount', () => {
    let removeAccountSpy

    afterEach(() => {
      removeAccountSpy.restore()
    })

    it('calls removeAccount in background and expect actions to show account', () => {
      const store = mockStore(devState)
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_ACCOUNTS_PAGE' },
      ]

      removeAccountSpy = sinon.spy(background, 'removeAccount')

      return store.dispatch(actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'))
        .then(() => {
          assert(removeAccountSpy.calledOnce)
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('displays warning error message when removeAccount callback errors', async () => {
      const store = mockStore()
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'DISPLAY_WARNING', value: 'error' },
      ]
      removeAccountSpy = sinon.stub(background, 'removeAccount')
      removeAccountSpy.callsFake((_, callback) => {
        callback(new Error('error'))
      })

      try {
        await store.dispatch(actions.removeAccount('0xe18035bf8712672935fdb4e5e431b1a0183d2dfc'))
        assert.fail('Should have thrown error')
      } catch (_) {
        assert.deepEqual(store.getActions(), expectedActions)
      }

    })
  })

  describe('#addNewKeyring', () => {
    let addNewKeyringSpy

    beforeEach(() => {
      addNewKeyringSpy = sinon.stub(background, 'addNewKeyring')
    })

    afterEach(() => {
      addNewKeyringSpy.restore()
    })

    it('calls addNewKeyring', () => {
      const privateKey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'

      const store = mockStore()
      store.dispatch(actions.addNewKeyring('Simple Key Pair', [ privateKey ]))
      assert(addNewKeyringSpy.calledOnce)
    })

    it('errors then addNewKeyring in background throws', () => {
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

  describe('#resetAccount', () => {

    let resetAccountSpy

    afterEach(() => {
      resetAccountSpy.restore()
    })

    it('resets account', async () => {

      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_ACCOUNTS_PAGE' },
      ]

      resetAccountSpy = sinon.spy(background, 'resetAccount')

      return store.dispatch(actions.resetAccount())
        .then(() => {
          assert(resetAccountSpy.calledOnce)
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('throws if resetAccount throws', async () => {
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

  describe('#importNewAccount', () => {

    let importAccountWithStrategySpy

    afterEach(() => {
      importAccountWithStrategySpy.restore()
    })

    it('calls importAccountWithStrategies in background', () => {
      const store = mockStore()

      importAccountWithStrategySpy = sinon.spy(background, 'importAccountWithStrategy')

      const importPrivkey = 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'

      return store.dispatch(actions.importNewAccount('Private Key', [ importPrivkey ]))
        .then(() => {
          assert(importAccountWithStrategySpy.calledOnce)
        })
    })

    it('displays warning error message when importAccount in background callback errors', async () => {
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

  describe('#addNewAccount', () => {

    let addNewAccountSpy

    afterEach(() => {
      addNewAccountSpy.restore()
    })

    it('Adds a new account', () => {
      const store = mockStore({ metamask: devState })

      addNewAccountSpy = sinon.spy(background, 'addNewAccount')

      return store.dispatch(actions.addNewAccount())
        .then(() => {
          assert(addNewAccountSpy.calledOnce)
        })
    })
  })

  describe('#setCurrentCurrency', () => {

    let setCurrentCurrencySpy

    beforeEach(() => {
      setCurrentCurrencySpy = sinon.stub(background, 'setCurrentCurrency')
    })

    afterEach(() => {
      setCurrentCurrencySpy.restore()
    })

    it('calls setCurrentCurrency', () => {
      const store = mockStore()

      store.dispatch(actions.setCurrentCurrency('jpy'))
      assert(setCurrentCurrencySpy.calledOnce)
    })

    it('throws if setCurrentCurrency throws', () => {
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

  describe('#signMsg', () => {

    let signMessageSpy, metamaskMsgs, msgId, messages

    const msgParams = {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    }

    beforeEach(() => {
      metamaskController.newUnsignedMessage(msgParams, noop)
      metamaskMsgs = metamaskController.messageManager.getUnapprovedMsgs()
      messages = metamaskController.messageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
      messages[0].msgParams.metamaskId = parseInt(msgId)
    })

    afterEach(() => {
      signMessageSpy.restore()
    })

    it('calls signMsg in background', () => {
      const store = mockStore()

      signMessageSpy = sinon.spy(background, 'signMessage')

      return store.dispatch(actions.signMsg(msgParams))
        .then(() => {
          assert(signMessageSpy.calledOnce)
        })

    })

    it('errors when signMessage in background throws', async () => {
      const store = mockStore()
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

  describe('#signPersonalMsg', () => {

    let signPersonalMessageSpy, metamaskMsgs, msgId, personalMessages

    const msgParams = {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    }

    beforeEach(() => {
      metamaskController.newUnsignedPersonalMessage(msgParams, noop)
      metamaskMsgs = metamaskController.personalMessageManager.getUnapprovedMsgs()
      personalMessages = metamaskController.personalMessageManager.messages
      msgId = Object.keys(metamaskMsgs)[0]
      personalMessages[0].msgParams.metamaskId = parseInt(msgId)
    })

    afterEach(() => {
      signPersonalMessageSpy.restore()
    })

    it('calls signPersonalMessage', () => {
      const store = mockStore()

      signPersonalMessageSpy = sinon.spy(background, 'signPersonalMessage')

      return store.dispatch(actions.signPersonalMsg(msgParams))
        .then(() => {
          assert(signPersonalMessageSpy.calledOnce)
        })

    })

    it('throws if signPersonalMessage throws', async () => {
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

  describe('#signTx', () => {

    let sendTransactionSpy

    beforeEach(() => {
      global.ethQuery = new EthQuery(provider)
      sendTransactionSpy = sinon.stub(global.ethQuery, 'sendTransaction')
    })

    afterEach(() => {
      sendTransactionSpy.restore()
    })

    it('calls sendTransaction in global ethQuery', () => {
      const store = mockStore()
      store.dispatch(actions.signTx())
      assert(sendTransactionSpy.calledOnce)
    })

    it('errors in when sendTransaction throws', () => {
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

  describe('#signTokenTx', () => {

    let tokenSpy

    beforeEach(() => {
      global.eth = new Eth(provider)
      tokenSpy = sinon.spy(global.eth, 'contract')
    })

    afterEach(() => {
      tokenSpy.restore()
    })

    it('calls eth.contract', () => {
      const store = mockStore()
      store.dispatch(actions.signTokenTx())
      assert(tokenSpy.calledOnce)
    })
  })

  describe('#lockMetamask', () => {
    let backgroundSetLockedSpy

    afterEach(() => {
      backgroundSetLockedSpy.restore()
    })

    it('calls setLocked', () => {
      const store = mockStore()

      backgroundSetLockedSpy = sinon.spy(background, 'setLocked')

      return store.dispatch(actions.lockMetamask())
        .then(() => {
          assert(backgroundSetLockedSpy.calledOnce)
        })
    })

    it('returns display warning error with value when setLocked in background callback errors', () => {
      const store = mockStore()

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'DISPLAY_WARNING', value: 'error' },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'LOCK_METAMASK' },
      ]
      backgroundSetLockedSpy = sinon.stub(background, 'setLocked')
      backgroundSetLockedSpy.callsFake(callback => {
        callback(new Error('error'))
      })

      return store.dispatch(actions.lockMetamask())
        .then(() => {
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })
  })

  describe('#setSelectedAddress', () => {
    let setSelectedAddressSpy

    beforeEach(() => {
      setSelectedAddressSpy = sinon.stub(background, 'setSelectedAddress')
    })

    afterEach(() => {
      setSelectedAddressSpy.restore()
    })

    it('calls setSelectedAddress in background', () => {
      const store = mockStore({ metamask: devState })

      store.dispatch(actions.setSelectedAddress('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'))
      assert(setSelectedAddressSpy.calledOnce)
    })

    it('errors when setSelectedAddress throws', () => {
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

  describe('#showAccountDetail', () => {
    let setSelectedAddressSpy

    beforeEach(() => {
      setSelectedAddressSpy = sinon.stub(background, 'setSelectedAddress')
    })

    afterEach(() => {
      setSelectedAddressSpy.restore()
    })

    it('#showAccountDetail', () => {
      const store = mockStore()

      store.dispatch(actions.showAccountDetail())
      assert(setSelectedAddressSpy.calledOnce)
    })

    it('displays warning if setSelectedAddress throws', () => {
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

  describe('#addToken', () => {
    let addTokenSpy

    beforeEach(() => {
      addTokenSpy = sinon.stub(background, 'addToken')
    })

    afterEach(() => {
      addTokenSpy.restore()
    })

    it('calls addToken in background', () => {
      const store = mockStore()

      store.dispatch(actions.addToken())
        .then(() => {
          assert(addTokenSpy.calledOnce)
        })
    })

    it('errors when addToken in background throws', async () => {
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

  describe('#removeToken', () => {

    let removeTokenSpy

    beforeEach(() => {
      removeTokenSpy = sinon.stub(background, 'removeToken')
    })

    afterEach(() => {
      removeTokenSpy.restore()
    })

    it('calls removeToken in background', () => {
      const store = mockStore()
      store.dispatch(actions.removeToken())
        .then(() => {
          assert(removeTokenSpy.calledOnce)
        })
    })

    it('errors when removeToken in background fails', async () => {
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

  describe('#setProviderType', () => {
    let setProviderTypeSpy
    let store

    beforeEach(() => {
      store = mockStore({ metamask: { provider: {} } })
      setProviderTypeSpy = sinon.stub(background, 'setProviderType')
    })

    afterEach(() => {
      setProviderTypeSpy.restore()
    })

    it('calls setProviderType', () => {
      store.dispatch(actions.setProviderType())
      assert(setProviderTypeSpy.calledOnce)
    })

    it('displays warning when setProviderType throws', () => {
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

  describe('#setRpcTarget', () => {
    let setRpcTargetSpy

    beforeEach(() => {
      setRpcTargetSpy = sinon.stub(background, 'setCustomRpc')
    })

    afterEach(() => {
      setRpcTargetSpy.restore()
    })

    it('calls setRpcTarget', () => {
      const store = mockStore()
      store.dispatch(actions.setRpcTarget('http://localhost:8545'))
      assert(setRpcTargetSpy.calledOnce)
    })

    it('displays warning when setRpcTarget throws', () => {
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

  describe('#addToAddressBook', () => {
    let addToAddressBookSpy

    beforeEach(() => {
      addToAddressBookSpy = sinon.stub(background, 'setAddressBook')
    })

    afterEach(() => {
      addToAddressBookSpy.restore()
    })

    it('calls setAddressBook', () => {
      const store = mockStore({ metamask: devState })
      store.dispatch(actions.addToAddressBook('test'))
      assert(addToAddressBookSpy.calledOnce)
    })
  })

  describe('#exportAccount', () => {
    let submitPasswordSpy, exportAccountSpy

    afterEach(() => {
      submitPasswordSpy.restore()
      exportAccountSpy.restore()
    })

    it('returns expected actions for successful action', () => {
      const store = mockStore(devState)
      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'HIDE_LOADING_INDICATION' },
        { type: 'SHOW_PRIVATE_KEY', value: '7ec73b91bb20f209a7ff2d32f542c3420b4fccf14abcc7840d2eff0ebcb18505' },
      ]

      submitPasswordSpy = sinon.spy(background, 'submitPassword')
      exportAccountSpy = sinon.spy(background, 'exportAccount')

      return store.dispatch(actions.exportAccount(password, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'))
        .then(() => {
          assert(submitPasswordSpy.calledOnce)
          assert(exportAccountSpy.calledOnce)
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('returns action errors when first func callback errors', async () => {
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

    it('returns action errors when second func callback errors', async () => {
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

  describe('#setAccountLabel', () => {
    let setAccountLabelSpy

    beforeEach(() => {
      setAccountLabelSpy = sinon.stub(background, 'setAccountLabel')
    })

    it('calls setAccountLabel', () => {
      const store = mockStore()
      store.dispatch(actions.setAccountLabel('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc', 'test'))
      assert(setAccountLabelSpy.calledOnce)
    })
  })

  describe('#pairUpdate', () => {
    beforeEach(() => {
      nock('https://shapeshift.io')
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get('/marketinfo/btc_eth')
        .reply(200, {pair: 'BTC_ETH', rate: 25.68289016, minerFee: 0.00176, limit: 0.67748474, minimum: 0.00013569, maxLimit: 0.67758573})

      nock('https://shapeshift.io')
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get('/coins')
        .reply(200)
    })

    it('calls expected actions', () => {
      const store = mockStore()
      // issue with dispatch action in callback not showing
      const expectedActions = [
        { type: 'SHOW_SUB_LOADING_INDICATION' },
        { type: 'HIDE_WARNING' },
      ]

      store.dispatch(actions.pairUpdate('btc'))
      assert.deepEqual(store.getActions(), expectedActions)
    })
  })

  describe('#setFeatureFlag', () => {
    let setFeatureFlagSpy

    beforeEach(() => {
      setFeatureFlagSpy = sinon.stub(background, 'setFeatureFlag')
    })

    afterEach(() => {
      setFeatureFlagSpy.restore()
    })

    it('calls setFeatureFlag in the background', () => {
      const store = mockStore()

      store.dispatch(actions.setFeatureFlag())
      assert(setFeatureFlagSpy.calledOnce)
    })

    it('errors when setFeatureFlag in background throws', async () => {
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

  describe('#setCompletedOnboarding', () => {
    let completeOnboardingSpy

    beforeEach(() => {
      completeOnboardingSpy = sinon.stub(background, 'completeOnboarding')
      completeOnboardingSpy.callsFake(cb => cb())
    })

    after(() => {
      completeOnboardingSpy.restore()
    })

    it('completes onboarding', async () => {
      const store = mockStore()
      await store.dispatch(actions.setCompletedOnboarding())
      assert.equal(completeOnboardingSpy.callCount, 1)
    })
  })

  describe('#updateNetworkNonce', () => {
    let getTransactionCountSpy

    afterEach(() => {
      getTransactionCountSpy.restore()
    })

    it('calls getTransactionCount', () => {
      const store = mockStore()
      getTransactionCountSpy = sinon.spy(global.ethQuery, 'getTransactionCount')

      store.dispatch(actions.updateNetworkNonce())
        .then(() => {
          assert(getTransactionCountSpy.calledOnce)
        })
    })

    it('errors when getTransactionCount throws', async () => {
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

  describe('#setUseBlockie', () => {
    let setUseBlockieSpy

    beforeEach(() => {
      setUseBlockieSpy = sinon.stub(background, 'setUseBlockie')
    })

    afterEach(() => {
      setUseBlockieSpy.restore()
    })

    it('calls setUseBlockie in background', () => {
      const store = mockStore()

      store.dispatch(actions.setUseBlockie())
      assert(setUseBlockieSpy.calledOnce)
    })

    it('errors when setUseBlockie in background throws', () => {
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

  describe('#updateCurrentLocale', () => {
    let setCurrentLocaleSpy

    beforeEach(() => {
      fetchMock.get('*', enLocale)
    })

    afterEach(() => {
      setCurrentLocaleSpy.restore()
      fetchMock.restore()
    })

    it('calls expected actions', () => {
      const store = mockStore()
      setCurrentLocaleSpy = sinon.spy(background, 'setCurrentLocale')

      const expectedActions = [
        { type: 'SHOW_LOADING_INDICATION', value: undefined },
        { type: 'SET_CURRENT_LOCALE', value: { locale: 'en', messages: enLocale }},
        { type: 'HIDE_LOADING_INDICATION' },
      ]

      return store.dispatch(actions.updateCurrentLocale('en'))
        .then(() => {
          assert(setCurrentLocaleSpy.calledOnce)
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('calls expected actions', () => {
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

      return store.dispatch(actions.updateCurrentLocale('en'))
        .then(() => {
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })
  })

  describe('#markPasswordForgotten', () => {
    let markPasswordForgottenSpy

    beforeEach(() => {
      markPasswordForgottenSpy = sinon.stub(background, 'markPasswordForgotten')
    })

    afterEach(() => {
      markPasswordForgottenSpy.restore()
    })

    it('calls markPasswordForgotten', () => {
      const store = mockStore()
      store.dispatch(actions.markPasswordForgotten())
      assert(markPasswordForgottenSpy.calledOnce)
    })
  })

  describe('#unMarkPasswordForgotten', () => {
    let unMarkPasswordForgottenSpy

    beforeEach(() => {
      unMarkPasswordForgottenSpy = sinon.stub(background, 'unMarkPasswordForgotten')
    })

    afterEach(() => {
      unMarkPasswordForgottenSpy.restore()
    })

    it('calls unMarkPasswordForgotten', () => {
      const store = mockStore()
      store.dispatch(actions.unMarkPasswordForgotten())
      assert(unMarkPasswordForgottenSpy.calledOnce)
    })
  })


})
