import assert from 'assert'
import reduceMetamask from '../../../../../ui/app/ducks/metamask/metamask'
import * as actionConstants from '../../../../../ui/app/store/actionConstants'

describe('MetaMask Reducers', function () {
  it('init state', function () {
    const initState = reduceMetamask(undefined, {})
    assert(initState)
  })

  it('locks MetaMask', function () {
    const unlockMetaMaskState = {
      isUnlocked: true,
      selectedAddress: 'test address',
    }
    const lockMetaMask = reduceMetamask(unlockMetaMaskState, {
      type: actionConstants.LOCK_METAMASK,
    })

    assert.equal(lockMetaMask.isUnlocked, false)
  })

  it('sets rpc target', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_RPC_TARGET,
        value: 'https://custom.rpc',
      },
    )

    assert.equal(state.provider.rpcUrl, 'https://custom.rpc')
  })

  it('sets provider type', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_PROVIDER_TYPE,
        value: 'provider type',
      },
    )

    assert.equal(state.provider.type, 'provider type')
  })

  it('shows account detail', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: 'test address',
      },
    )

    assert.equal(state.isUnlocked, true)
    assert.equal(state.isInitialized, true)
    assert.equal(state.selectedAddress, 'test address')
  })

  it('sets account label', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_ACCOUNT_LABEL,
        value: {
          account: 'test account',
          label: 'test label',
        },
      },
    )

    assert.deepEqual(state.identities, {
      'test account': { name: 'test label' },
    })
  })

  it('sets current fiat', function () {
    const value = {
      currentCurrency: 'yen',
      conversionRate: 3.14,
      conversionDate: new Date(2018, 9),
    }

    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_CURRENT_FIAT,
        value,
      },
    )

    assert.equal(state.currentCurrency, value.currentCurrency)
    assert.equal(state.conversionRate, value.conversionRate)
    assert.equal(state.conversionDate, value.conversionDate)
  })

  it('updates tokens', function () {
    const newTokens = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    }

    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_TOKENS,
        newTokens,
      },
    )

    assert.deepEqual(state.tokens, newTokens)
  })

  it('updates send gas limit', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_GAS_LIMIT,
        value: '0xGasLimit',
      },
    )

    assert.equal(state.send.gasLimit, '0xGasLimit')
  })

  it('updates send gas price', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_GAS_PRICE,
        value: '0xGasPrice',
      },
    )

    assert.equal(state.send.gasPrice, '0xGasPrice')
  })

  it('toggles account menu ', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.TOGGLE_ACCOUNT_MENU,
      },
    )

    assert.equal(state.isAccountMenuOpen, true)
  })

  it('updates gas total', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_GAS_TOTAL,
        value: '0xGasTotal',
      },
    )

    assert.equal(state.send.gasTotal, '0xGasTotal')
  })

  it('updates send token balance', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_TOKEN_BALANCE,
        value: '0xTokenBalance',
      },
    )

    assert.equal(state.send.tokenBalance, '0xTokenBalance')
  })

  it('updates data', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_HEX_DATA,
        value: '0xData',
      },
    )

    assert.equal(state.send.data, '0xData')
  })

  it('updates send to', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_TO,
        value: {
          to: '0xAddress',
          nickname: 'nickname',
        },
      },
    )

    assert.equal(state.send.to, '0xAddress')
    assert.equal(state.send.toNickname, 'nickname')
  })

  it('update send amount', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_AMOUNT,
        value: '0xAmount',
      },
    )

    assert.equal(state.send.amount, '0xAmount')
  })

  it('updates max mode', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_MAX_MODE,
        value: true,
      },
    )

    assert.equal(state.send.maxModeOn, true)
  })

  it('update send', function () {
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
      ensResolution: null,
      ensResolutionError: '',
    }

    const sendState = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND,
        value,
      },
    )

    assert.deepEqual(sendState.send, value)
  })

  it('clears send', function () {
    const initStateSend = {
      send: {
        gasLimit: null,
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
        toNickname: '',
      },
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
      },
    }

    const state = reduceMetamask(sendState, {
      type: actionConstants.CLEAR_SEND,
    })

    assert.deepEqual(state.send, initStateSend.send)
  })

  it('updates value of tx by id', function () {
    const oldState = {
      currentNetworkTxList: [
        {
          id: 1,
          txParams: 'foo',
        },
      ],
    }

    const state = reduceMetamask(oldState, {
      type: actionConstants.UPDATE_TRANSACTION_PARAMS,
      id: 1,
      value: 'bar',
    })

    assert.equal(state.currentNetworkTxList[0].txParams, 'bar')
  })

  it('sets blockies', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_USE_BLOCKIE,
        value: true,
      },
    )

    assert.equal(state.useBlockie, true)
  })

  it('updates an arbitrary feature flag', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_FEATURE_FLAGS,
        value: {
          foo: true,
        },
      },
    )

    assert.equal(state.featureFlags.foo, true)
  })

  it('close welcome screen', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.CLOSE_WELCOME_SCREEN,
      },
    )

    assert.equal(state.welcomeScreenSeen, true)
  })

  it('sets current locale', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_CURRENT_LOCALE,
        value: { locale: 'ge' },
      },
    )

    assert.equal(state.currentLocale, 'ge')
  })

  it('sets pending tokens ', function () {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    }

    const pendingTokensState = reduceMetamask(
      {},
      {
        type: actionConstants.SET_PENDING_TOKENS,
        payload,
      },
    )

    assert.deepEqual(pendingTokensState.pendingTokens, payload)
  })

  it('clears pending tokens', function () {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    }

    const pendingTokensState = {
      pendingTokens: payload,
    }

    const state = reduceMetamask(pendingTokensState, {
      type: actionConstants.CLEAR_PENDING_TOKENS,
    })

    assert.deepEqual(state.pendingTokens, {})
  })

  it('update ensResolution', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_ENS_RESOLUTION,
        payload: '0x1337',
      },
    )

    assert.deepEqual(state.send.ensResolution, '0x1337')
    assert.deepEqual(state.send.ensResolutionError, '')
  })

  it('update ensResolutionError', function () {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_ENS_RESOLUTION_ERROR,
        payload: 'ens name not found',
      },
    )

    assert.deepEqual(state.send.ensResolutionError, 'ens name not found')
    assert.deepEqual(state.send.ensResolution, null)
  })
})
