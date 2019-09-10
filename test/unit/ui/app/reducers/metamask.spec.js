import assert from 'assert'
import reduceMetamask from '../../../../../ui/app/ducks/metamask/metamask'
import * as actions from '../../../../../ui/app/store/actions'

describe('MetaMask Reducers', () => {

  it('init state', () => {
    const initState = reduceMetamask({metamask: {}}, {})
    assert(initState)
  })

  it('unlocks MetaMask', () => {
    const state = reduceMetamask({}, {
      type: actions.UNLOCK_METAMASK,
      value: 'test address',
    })

    assert.equal(state.isUnlocked, true)
    assert.equal(state.isInitialized, true)
    assert.equal(state.selectedAddress, 'test address')
  })

  it('locks MetaMask', () => {
    const unlockMetaMaskState = {
      metamask: {
        isUnlocked: true,
        isInitialzed: false,
        selectedAddress: 'test address',
      },
    }
    const lockMetaMask = reduceMetamask(unlockMetaMaskState, {
      type: actions.LOCK_METAMASK,
    })

    assert.equal(lockMetaMask.isUnlocked, false)
  })

  it('sets frequent rpc list', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_RPC_LIST,
      value: 'https://custom.rpc',
    })

    assert.equal(state.frequentRpcList, 'https://custom.rpc')
  })

  it('sets rpc target', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_RPC_TARGET,
      value: 'https://custom.rpc',
    })

    assert.equal(state.provider.rpcTarget, 'https://custom.rpc')
  })

  it('sets provider type', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_PROVIDER_TYPE,
      value: 'provider type',
    })

    assert.equal(state.provider.type, 'provider type')
  })

  describe('CompletedTx', () => {
    const oldState = {
      metamask: {
        unapprovedTxs: {
          1: {
            id: 1,
            time: 1538495996507,
            status: 'unapproved',
            metamaskNetworkId: 4,
            loadingDefaults: false,
            txParams: {
              from: '0xAddress',
              to: '0xAddress2',
              value: '0x16345785d8a0000',
              gas: '0x5208',
              gasPrice: '0x3b9aca00',
            },
            type: 'standard',
          },
          2: {
            test: 'Should persist',
          },
        },
        unapprovedMsgs: {
          1: {
            id: 2,
            msgParams: {
              from: '0xAddress',
              data: '0xData',
              origin: 'test origin',
            },
            time: 1538498521717,
            status: 'unapproved',
            type: 'eth_sign',
          },
          2: {
            test: 'Should Persist',
          },
        },
      },
    }

    it('removes tx from new state if completed in action.', () => {

      const state = reduceMetamask(oldState, {
        type: actions.COMPLETED_TX,
        id: 1,
      })

      assert.equal(Object.keys(state.unapprovedTxs).length, 1)
      assert.equal(state.unapprovedTxs[2].test, 'Should persist')
    })

    it('removes msg from new state if completed id in action', () => {
      const state = reduceMetamask(oldState, {
        type: actions.COMPLETED_TX,
        id: 1,
      })

      assert.equal(Object.keys(state.unapprovedMsgs).length, 1)
      assert.equal(state.unapprovedTxs[2].test, 'Should persist')
    })
  })

  it('shows account detail', () => {

    const state = reduceMetamask({}, {
      type: actions.SHOW_ACCOUNT_DETAIL,
      value: 'test address',
    })

    assert.equal(state.isUnlocked, true)
    assert.equal(state.isInitialized, true)
    assert.equal(state.selectedAddress, 'test address')
  })

  it('sets select ', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_SELECTED_TOKEN,
      value: 'test token',
    })

    assert.equal(state.selectedTokenAddress, 'test token')
  })

  it('sets account label', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_ACCOUNT_LABEL,
      value: {
        account: 'test account',
        label: 'test label',
      },
    })

    assert.deepEqual(state.identities, { 'test account': { name: 'test label' } })
  })

  it('sets current fiat', () => {
    const value = {
      currentCurrency: 'yen',
      conversionRate: 3.14,
      conversionDate: new Date(2018, 9),
    }

    const state = reduceMetamask({}, {
      type: actions.SET_CURRENT_FIAT,
      value,
    })

    assert.equal(state.currentCurrency, value.currentCurrency)
    assert.equal(state.conversionRate, value.conversionRate)
    assert.equal(state.conversionDate, value.conversionDate)
  })

  it('updates tokens', () => {
    const newTokens = {
      'address': '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      'decimals': 18,
      'symbol': 'META',
    }

    const state = reduceMetamask({}, {
      type: actions.UPDATE_TOKENS,
      newTokens,
    })

    assert.deepEqual(state.tokens, newTokens)
  })

  it('updates send gas limit', () => {

    const state = reduceMetamask({}, {
      type: actions.UPDATE_GAS_LIMIT,
      value: '0xGasLimit',
    })

    assert.equal(state.send.gasLimit, '0xGasLimit')
  })

  it('updates send gas price', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_GAS_PRICE,
      value: '0xGasPrice',
    })

    assert.equal(state.send.gasPrice, '0xGasPrice')
  })

  it('toggles account menu ', () => {
    const state = reduceMetamask({}, {
      type: actions.TOGGLE_ACCOUNT_MENU,
    })

    assert.equal(state.isAccountMenuOpen, true)
  })

  it('updates gas total', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_GAS_TOTAL,
      value: '0xGasTotal',
    })

    assert.equal(state.send.gasTotal, '0xGasTotal')
  })

  it('updates send token balance', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_TOKEN_BALANCE,
      value: '0xTokenBalance',
    })

    assert.equal(state.send.tokenBalance, '0xTokenBalance')
  })

  it('updates data', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_HEX_DATA,
      value: '0xData',
    })

    assert.equal(state.send.data, '0xData')
  })

  it('updates send to', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_TO,
      value: {
        to: '0xAddress',
        nickname: 'nickname',
      },
    })

    assert.equal(state.send.to, '0xAddress')
    assert.equal(state.send.toNickname, 'nickname')
  })

  it('update send from', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_FROM,
      value: '0xAddress',
    })

    assert.equal(state.send.from, '0xAddress')
  })

  it('update send amount', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_AMOUNT,
      value: '0xAmount',
    })

    assert.equal(state.send.amount, '0xAmount')
  })

  it('update send memo', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_MEMO,
      value: '0xMemo',
    })

    assert.equal(state.send.memo, '0xMemo')
  })

  it('updates max mode', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_MAX_MODE,
      value: true,
    })

    assert.equal(state.send.maxModeOn, true)
  })

  it('update send', () => {
    const value = {
      gasLimit: '0xGasLimit',
      gasPrice: '0xGasPrice',
      gasTotal: '0xGasTotal',
      tokenBalance: '0xBalance',
      from: '0xAddress',
      to: '0xAddress',
      toNickname: '',
      maxModeOn: false,
      amount: '0xAmount',
      memo: '0xMemo',
      errors: {},
      editingTransactionId: 22,
      forceGasMin: '0xGas',
      ensResolution: null,
      ensResolutionError: '',
    }

    const sendState = reduceMetamask({}, {
      type: actions.UPDATE_SEND,
      value,
    })

    assert.deepEqual(sendState.send, value)
  })

  it('clears send', () => {
    const initStateSend = {
      send:
      { gasLimit: null,
        gasPrice: null,
        gasTotal: null,
        tokenBalance: null,
        from: '',
        to: '',
        amount: '0x0',
        memo: '',
        errors: {},
        maxModeOn: false,
        editingTransactionId: null,
        forceGasMin: null,
        toNickname: '' },
    }

    const sendState = {
      send: {
        gasLimit: '0xGasLimit',
        gasPrice: '0xGasPrice',
        gasTotal: '0xGasTotal',
        tokenBalance: '0xBalance',
        from: '0xAddress',
        to: '0xAddress',
        toNickname: '',
        maxModeOn: false,
        amount: '0xAmount',
        memo: '0xMemo',
        errors: {},
        editingTransactionId: 22,
        forceGasMin: '0xGas',
      },
    }


    const state = reduceMetamask(sendState, {
      type: actions.CLEAR_SEND,
    })

    assert.deepEqual(state.send, initStateSend.send)
  })

  it('updates value of tx by id', () => {
    const oldState = {
      metamask: {
        selectedAddressTxList: [
          {
            id: 1,
            txParams: 'foo',
          },
        ],
      },
    }

    const state = reduceMetamask(oldState, {
      type: actions.UPDATE_TRANSACTION_PARAMS,
      id: 1,
      value: 'bar',
    })

    assert.equal(state.selectedAddressTxList[0].txParams, 'bar')
  })

  it('updates pair for shapeshift', () => {
    const state = reduceMetamask({}, {
      type: actions.PAIR_UPDATE,
      value: {
        marketinfo: {
          pair: 'test pair',
          foo: 'bar',
        },
      },
    })
    assert.equal(state.tokenExchangeRates['test pair'].pair, 'test pair')
  })

  it('upates pair and coin options for shapeshift subview', () => {
    const state = reduceMetamask({}, {
      type: actions.SHAPESHIFT_SUBVIEW,
      value: {
        marketinfo: {
          pair: 'test pair',
        },
        coinOptions: {
          foo: 'bar',
        },
      },
    })

    assert.equal(state.coinOptions.foo, 'bar')
    assert.equal(state.tokenExchangeRates['test pair'].pair, 'test pair')
  })

  it('sets blockies', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_USE_BLOCKIE,
      value: true,
    })

    assert.equal(state.useBlockie, true)
  })

  it('updates an arbitrary feature flag', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_FEATURE_FLAGS,
      value: {
        foo: true,
      },
    })

    assert.equal(state.featureFlags.foo, true)
  })

  it('updates network endpoint type', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_NETWORK_ENDPOINT_TYPE,
      value: 'endpoint',
    })

    assert.equal(state.networkEndpointType, 'endpoint')
  })

  it('close welcome screen', () => {
    const state = reduceMetamask({}, {
      type: actions.CLOSE_WELCOME_SCREEN,
    })

    assert.equal(state.welcomeScreenSeen, true)
  })

  it('sets current locale', () => {
    const state = reduceMetamask({}, {
      type: actions.SET_CURRENT_LOCALE,
      value: { locale: 'ge' },
    })

    assert.equal(state.currentLocale, 'ge')
  })

  it('sets pending tokens ', () => {
    const payload = {
      'address': '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      'decimals': 18,
      'symbol': 'META',
    }

    const pendingTokensState = reduceMetamask({}, {
      type: actions.SET_PENDING_TOKENS,
      payload,
    })

    assert.deepEqual(pendingTokensState.pendingTokens, payload)
  })

  it('clears pending tokens', () => {
    const payload = {
      'address': '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      'decimals': 18,
      'symbol': 'META',
    }

    const pendingTokensState = {
      pendingTokens: payload,
    }

    const state = reduceMetamask(pendingTokensState, {
      type: actions.CLEAR_PENDING_TOKENS,
    })

    assert.deepEqual(state.pendingTokens, {})
  })

  it('update ensResolution', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_ENS_RESOLUTION,
      payload: '0x1337',
    })

    assert.deepEqual(state.send.ensResolution, '0x1337')
    assert.deepEqual(state.send.ensResolutionError, '')
  })

  it('update ensResolutionError', () => {
    const state = reduceMetamask({}, {
      type: actions.UPDATE_SEND_ENS_RESOLUTION_ERROR,
      payload: 'ens name not found',
    })

    assert.deepEqual(state.send.ensResolutionError, 'ens name not found')
    assert.deepEqual(state.send.ensResolution, null)
  })
})
