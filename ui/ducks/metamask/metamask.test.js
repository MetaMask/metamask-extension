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
      },
    );

    expect(state.isUnlocked).toStrictEqual(true);
    expect(state.isInitialized).toStrictEqual(true);
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

  it('toggles account menu', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.TOGGLE_ACCOUNT_MENU,
      },
    );

    expect(state.isAccountMenuOpen).toStrictEqual(true);
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
});
