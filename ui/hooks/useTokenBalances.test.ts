import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { BtcScope } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  tokenBalancesStartPolling,
  tokenBalancesStopPollingByPollingToken,
} from '../store/actions';
import { ASSETS_UNIFY_STATE_FLAG } from '../../shared/lib/assets-unify-state/remote-feature-flag';
import {
  useTokenBalances,
  useTokenTracker,
  stringifyBalance,
} from './useTokenBalances';

jest.mock('../store/actions', () => ({
  tokenBalancesStartPolling: jest
    .fn()
    .mockImplementation((input) =>
      Promise.resolve(`${JSON.stringify(input)}_token`),
    ),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

const mockTokenBalancesStartPolling = jest.mocked(tokenBalancesStartPolling);
const mockTokenBalancesStopPollingByPollingToken = jest.mocked(
  tokenBalancesStopPollingByPollingToken,
);

const BASE_STATE = {
  metamask: {
    completedOnboarding: true,
    isUnlocked: true,
    tokenBalances: {
      '0xAddress': {
        '0x1': {
          '0xToken1': '0x64', // 100 in hex
        },
      },
    },
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        isEvm: true,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
      },
    },
    enabledNetworkMap: {
      eip155: {
        '0x1': true,
      },
    },
    selectedMultichainNetworkChainId: BtcScope.Mainnet,
    isEvmSelected: true,
    multichainNetworkConfigurationsByChainId:
      AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
    remoteFeatureFlags: {},
  },
};

describe('useTokenBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns token balances from state', () => {
    const { result } = renderHookWithProvider(
      () => useTokenBalances(),
      BASE_STATE,
    );

    expect(result.current.tokenBalances).toEqual(
      BASE_STATE.metamask.tokenBalances,
    );
  });

  it('starts polling for enabled chain ids when no chainIds are provided', async () => {
    renderHookWithProvider(() => useTokenBalances(), BASE_STATE);

    await waitFor(() => {
      expect(mockTokenBalancesStartPolling).toHaveBeenCalled();
    });
  });

  it('starts polling for specified chain ids when provided', async () => {
    renderHookWithProvider(
      () => useTokenBalances({ chainIds: ['0x89'] }),
      BASE_STATE,
    );

    await waitFor(() => {
      expect(mockTokenBalancesStartPolling).toHaveBeenCalledWith(['0x89']);
    });
  });

  it('does not start polling when assets-unify-state is enabled', () => {
    const state = {
      ...BASE_STATE,
      metamask: {
        ...BASE_STATE.metamask,
        remoteFeatureFlags: {
          [ASSETS_UNIFY_STATE_FLAG]: {
            enabled: true,
            featureVersion: '1',
            minimumVersion: '1.0.0',
          },
        },
      },
    };

    const { result } = renderHookWithProvider(() => useTokenBalances(), state);

    // Does not start polling (empty input array)
    expect(mockTokenBalancesStartPolling).not.toHaveBeenCalled();
  });

  it('stops polling on unmount', async () => {
    const { unmount } = renderHookWithProvider(
      () => useTokenBalances(),
      BASE_STATE,
    );

    await waitFor(() => {
      expect(mockTokenBalancesStartPolling).toHaveBeenCalled();
    });

    unmount();

    expect(mockTokenBalancesStopPollingByPollingToken).toHaveBeenCalled();
  });
});

describe('useTokenTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const tokens = [
    { address: '0xToken1', symbol: 'TK1', decimals: 18 },
    { address: '0xToken2', symbol: 'TK2', decimals: 6 },
  ];

  it('returns tokens with balances from state', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTokenTracker({
          chainId: '0x1',
          tokens,
          address: '0xAddress',
        }),
      BASE_STATE,
    );

    expect(result.current.tokensWithBalances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ address: '0xToken1', balance: '100' }),
        expect.objectContaining({ address: '0xToken2', balance: '0' }),
      ]),
    );
  });

  it('filters zero-balance tokens when hideZeroBalanceTokens is true', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTokenTracker({
          chainId: '0x1',
          tokens,
          address: '0xAddress',
          hideZeroBalanceTokens: true,
        }),
      BASE_STATE,
    );

    expect(result.current.tokensWithBalances).toHaveLength(1);
    expect(result.current.tokensWithBalances[0].address).toBe('0xToken1');
  });

  it('returns placeholder balances when assets-unify-state is enabled', () => {
    const state = {
      ...BASE_STATE,
      metamask: {
        ...BASE_STATE.metamask,
        remoteFeatureFlags: {
          [ASSETS_UNIFY_STATE_FLAG]: {
            enabled: true,
            featureVersion: '1',
            minimumVersion: '1.0.0',
          },
        },
      },
    };

    const { result } = renderHookWithProvider(
      () =>
        useTokenTracker({
          chainId: '0x1',
          tokens,
          address: '0xAddress',
        }),
      state,
    );

    expect(result.current.tokensWithBalances).toEqual(
      tokens.map((t) => ({
        ...t,
        balance: '0',
        balanceError: null,
        string: stringifyBalance('0', t.decimals),
      })),
    );
  });
});

describe('stringifyBalance', () => {
  it('returns "0" for zero balance', () => {
    expect(stringifyBalance('0', 18)).toBe('0');
  });

  it('formats balance with decimals', () => {
    expect(stringifyBalance('1000000', 6)).toBe('1');
  });

  it('formats balance with fractional part', () => {
    expect(stringifyBalance('1500000', 6)).toBe('1.5');
  });

  it('handles zero decimals', () => {
    expect(stringifyBalance('42', 0)).toBe('42');
  });

  it('handles balance shorter than decimal places', () => {
    expect(stringifyBalance('1', 6)).toBe('0.000001');
  });

  it('strips trailing zeroes from fractional part', () => {
    expect(stringifyBalance('1100000', 6)).toBe('1.1');
  });
});
