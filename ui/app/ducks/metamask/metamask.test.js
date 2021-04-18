import * as actionConstants from '../../store/actionConstants';
import reduceMetamask from './metamask';

describe('MetaMask Reducers', () => {
  it('init state', () => {
    const initState = reduceMetamask(undefined, {});
    expect.anything(initState);
  });

  it('locks MetaMask', () => {
    const unlockMetaMaskState = {
      isUnlocked: true,
      selectedAddress: 'test address',
    };
    const lockMetaMask = reduceMetamask(unlockMetaMaskState, {
      type: actionConstants.LOCK_METAMASK,
    });

    expect(lockMetaMask.isUnlocked).toStrictEqual(false);
  });

  it('sets rpc target', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_RPC_TARGET,
        value: 'https://custom.rpc',
      },
    );

    expect(state.provider.rpcUrl).toStrictEqual('https://custom.rpc');
  });

  it('sets provider type', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_PROVIDER_TYPE,
        value: 'provider type',
      },
    );

    expect(state.provider.type).toStrictEqual('provider type');
  });

  it('shows account detail', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: 'test address',
      },
    );

    expect(state.isUnlocked).toStrictEqual(true);
    expect(state.isInitialized).toStrictEqual(true);
    expect(state.selectedAddress).toStrictEqual('test address');
  });

  it('sets account label', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_ACCOUNT_LABEL,
        value: {
          account: 'test account',
          label: 'test label',
        },
      },
    );

    expect(state.identities).toStrictEqual({
      'test account': { name: 'test label' },
    });
  });

  it('sets current fiat', () => {
    const value = {
      currentCurrency: 'yen',
      conversionRate: 3.14,
      conversionDate: new Date(2018, 9),
    };

    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_CURRENT_FIAT,
        value,
      },
    );

    expect(state.currentCurrency).toStrictEqual(value.currentCurrency);
    expect(state.conversionRate).toStrictEqual(value.conversionRate);
    expect(state.conversionDate).toStrictEqual(value.conversionDate);
  });

  it('updates tokens', () => {
    const newTokens = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_TOKENS,
        newTokens,
      },
    );

    expect(state.tokens).toStrictEqual(newTokens);
  });

  it('updates send gas limit', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_GAS_LIMIT,
        value: '0xGasLimit',
      },
    );

    expect(state.send.gasLimit).toStrictEqual('0xGasLimit');
  });

  it('updates send gas price', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_GAS_PRICE,
        value: '0xGasPrice',
      },
    );

    expect(state.send.gasPrice).toStrictEqual('0xGasPrice');
  });

  it('toggles account menu', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.TOGGLE_ACCOUNT_MENU,
      },
    );

    expect(state.isAccountMenuOpen).toStrictEqual(true);
  });

  it('updates gas total', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_GAS_TOTAL,
        value: '0xGasTotal',
      },
    );

    expect(state.send.gasTotal).toStrictEqual('0xGasTotal');
  });

  it('updates send token balance', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_TOKEN_BALANCE,
        value: '0xTokenBalance',
      },
    );

    expect(state.send.tokenBalance).toStrictEqual('0xTokenBalance');
  });

  it('updates data', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_HEX_DATA,
        value: '0xData',
      },
    );

    expect(state.send.data).toStrictEqual('0xData');
  });

  it('updates send to', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_TO,
        value: {
          to: '0xAddress',
          nickname: 'nickname',
        },
      },
    );

    expect(state.send.to).toStrictEqual('0xAddress');
    expect(state.send.toNickname).toStrictEqual('nickname');
  });

  it('update send amount', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_AMOUNT,
        value: '0xAmount',
      },
    );

    expect(state.send.amount).toStrictEqual('0xAmount');
  });

  it('updates max mode', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_MAX_MODE,
        value: true,
      },
    );

    expect(state.send.maxModeOn).toStrictEqual(true);
  });

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
      ensResolution: null,
      ensResolutionError: '',
    };

    const sendState = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND,
        value,
      },
    );

    expect(sendState.send).toStrictEqual(value);
  });

  it('clears send', () => {
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
    };

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
    };

    const state = reduceMetamask(sendState, {
      type: actionConstants.CLEAR_SEND,
    });

    expect(state.send).toStrictEqual(initStateSend.send);
  });

  it('updates value of tx by id', () => {
    const oldState = {
      currentNetworkTxList: [
        {
          id: 1,
          txParams: 'foo',
        },
      ],
    };

    const state = reduceMetamask(oldState, {
      type: actionConstants.UPDATE_TRANSACTION_PARAMS,
      id: 1,
      value: 'bar',
    });

    expect(state.currentNetworkTxList[0].txParams).toStrictEqual('bar');
  });

  it('sets blockies', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_USE_BLOCKIE,
        value: true,
      },
    );

    expect(state.useBlockie).toStrictEqual(true);
  });

  it('updates an arbitrary feature flag', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_FEATURE_FLAGS,
        value: {
          foo: true,
        },
      },
    );

    expect(state.featureFlags.foo).toStrictEqual(true);
  });

  it('close welcome screen', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.CLOSE_WELCOME_SCREEN,
      },
    );

    expect(state.welcomeScreenSeen).toStrictEqual(true);
  });

  it('sets current locale', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_CURRENT_LOCALE,
        value: { locale: 'ge' },
      },
    );

    expect(state.currentLocale).toStrictEqual('ge');
  });

  it('sets pending tokens', () => {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const pendingTokensState = reduceMetamask(
      {},
      {
        type: actionConstants.SET_PENDING_TOKENS,
        payload,
      },
    );

    expect(pendingTokensState.pendingTokens).toStrictEqual(payload);
  });

  it('clears pending tokens', () => {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const pendingTokensState = {
      pendingTokens: payload,
    };

    const state = reduceMetamask(pendingTokensState, {
      type: actionConstants.CLEAR_PENDING_TOKENS,
    });

    expect(state.pendingTokens).toStrictEqual({});
  });

  it('update ensResolution', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_ENS_RESOLUTION,
        payload: '0x1337',
      },
    );

    expect(state.send.ensResolution).toStrictEqual('0x1337');
    expect(state.send.ensResolutionError).toStrictEqual('');
  });

  it('update ensResolutionError', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.UPDATE_SEND_ENS_RESOLUTION_ERROR,
        payload: 'ens name not found',
      },
    );

    expect(state.send.ensResolutionError).toStrictEqual('ens name not found');
    expect(state.send.ensResolution).toBeNull();
  });
});
