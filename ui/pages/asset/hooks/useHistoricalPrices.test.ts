import { SolScope } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { apiClient } from '../../../helpers/api-client';
import {
  DEFAULT_USE_HISTORICAL_PRICES_METADATA,
  useHistoricalPrices,
} from './useHistoricalPrices';

jest.mock('../../../helpers/api-client', () => ({
  apiClient: {
    prices: {
      fetch: jest.fn(),
    },
  },
}));

const mockPricesFetch = jest.mocked(
  (apiClient.prices as unknown as { fetch: jest.Mock }).fetch,
);

/**
 * In these tests, we represent the price data with 1 point per day.
 * For instance P7D: [1, 100], [2, 102], [3, 102], [4, 105], [5, 99], [6, 102], [7, 100]
 */

const SEVEN_DAY_PRICES: [number, number][] = [
  [1, 100],
  [2, 102],
  [3, 102],
  [4, 105],
  [5, 99],
  [6, 102],
  [7, 100],
];

const SEVEN_DAY_POINTS = [
  { x: 1, y: 100 },
  { x: 2, y: 102 },
  { x: 3, y: 102 },
  { x: 4, y: 105 },
  { x: 5, y: 99 },
  { x: 6, y: 102 },
  { x: 7, y: 100 },
];

const SEVEN_DAY_METADATA = {
  minPricePoint: { x: 5, y: 99 },
  maxPricePoint: { x: 4, y: 105 },
  xMin: 1,
  xMax: 7,
  yMin: 99,
  yMax: 105,
};

const mockBaseState = {
  metamask: {
    isUnlocked: true,
    completedOnboarding: true,
    selectedNetworkClientId: 'selectedNetworkClientId',
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        isEvm: true,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'selectedNetworkClientId' }],
      },
      [SolScope.Mainnet]: {
        chainId: SolScope.Mainnet,
        name: 'Solana',
        nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
        isEvm: false,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'selectedNetworkClientId2' }],
      },
    },
    currencyRates: { ETH: { conversionRate: 1 } },
    remoteFeatureFlags: {},
    useCurrencyRateCheck: true,
    internalAccounts: {
      accounts: {
        '81b1ead4-334c-4921-9adf-282fde539752': {
          id: '81b1ead4-334c-4921-9adf-282fde539752',
          address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
          type: 'eip155:eoa',
          scopes: ['eip155'],
        },
        '5132883f-598e-482c-a02b-84eeaa352f5b': {
          id: '5132883f-598e-482c-a02b-84eeaa352f5b',
          address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
          type: 'solana:data-account',
          scopes: [SolScope.Mainnet],
        },
      },
      selectedAccount: '',
    },
    selectedAccountGroup: 'entropy:wallet1/0',
    accountTree: {
      wallets: {
        'entropy:wallet1': {
          id: 'entropy:wallet1',
          type: 'entropy',
          status: 'ready',
          groups: {
            'entropy:wallet1/0': {
              id: 'entropy:wallet1/0',
              type: 'multichainAccount',
              accounts: [
                '81b1ead4-334c-4921-9adf-282fde539752',
                '5132883f-598e-482c-a02b-84eeaa352f5b',
              ],
              metadata: {
                name: 'Wallet 1',
                entropy: { groupIndex: 0 },
                pinned: false,
                hidden: false,
                lastSelected: 0,
              },
            },
          },
          metadata: {
            name: 'Wallet 1',
            entropy: { id: 'wallet1' },
          },
        },
      },
    },
  },
};

describe('useHistoricalPrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPricesFetch.mockResolvedValue({ prices: [] });
  });

  describe('EVM chain', () => {
    const chainId = '0x1';
    const address = '0x458036e7bc0612e9b207640dc07ca7711346aae5';
    const currency = 'usd';
    const timeRange = 'P7D';
    const state = {
      ...mockBaseState,
      metamask: {
        ...mockBaseState.metamask,
        internalAccounts: {
          ...mockBaseState.metamask.internalAccounts,
          selectedAccount: '81b1ead4-334c-4921-9adf-282fde539752',
        },
      },
    };

    it('returns loading true and default data initially', () => {
      const { result, unmount } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      expect(result.current).toEqual({
        loading: true,
        data: {
          prices: [],
          metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
        },
      });

      unmount();
    });

    it('returns historical prices on successful fetch', async () => {
      mockPricesFetch.mockResolvedValue({ prices: SEVEN_DAY_PRICES });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: { prices: SEVEN_DAY_POINTS, metadata: SEVEN_DAY_METADATA },
      });
    });

    it('calls v3 endpoint with correct CAIP params', async () => {
      mockPricesFetch.mockResolvedValue({ prices: SEVEN_DAY_PRICES });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockPricesFetch).toHaveBeenCalledWith(
        'https://price.api.cx.metamask.io',
        expect.stringMatching(
          /\/v3\/historical-prices\/eip155:1\/erc20:0x[0-9a-fA-F]{40}/u,
        ),
        expect.objectContaining({
          params: expect.objectContaining({
            vsCurrency: 'usd',
            timePeriod: '7D',
          }),
        }),
      );
    });

    it('returns default data on fetch error', async () => {
      mockPricesFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: {
          prices: [],
          metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
        },
      });

      consoleSpy.mockRestore();
    });
  });

  describe('non-EVM chain (Solana)', () => {
    const chainId = SolScope.Mainnet;
    const address = '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC';
    const currency = 'usd';
    const timeRange = 'P7D';
    const state = {
      ...mockBaseState,
      metamask: {
        ...mockBaseState.metamask,
        internalAccounts: {
          ...mockBaseState.metamask.internalAccounts,
          selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
        },
      },
    };

    it('returns loading true and default data initially', () => {
      const { result, unmount } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      expect(result.current).toEqual({
        loading: true,
        data: {
          prices: [],
          metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
        },
      });

      unmount();
    });

    it('returns historical prices on successful fetch', async () => {
      mockPricesFetch.mockResolvedValue({ prices: SEVEN_DAY_PRICES });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: { prices: SEVEN_DAY_POINTS, metadata: SEVEN_DAY_METADATA },
      });
    });

    it('calls v3 endpoint with correct Solana CAIP params', async () => {
      mockPricesFetch.mockResolvedValue({ prices: SEVEN_DAY_PRICES });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockPricesFetch).toHaveBeenCalledWith(
        'https://price.api.cx.metamask.io',
        expect.stringContaining(
          `/v3/historical-prices/${SolScope.Mainnet}/token:`,
        ),
        expect.objectContaining({
          params: expect.objectContaining({
            vsCurrency: 'usd',
            timePeriod: '7D',
          }),
        }),
      );
    });

    it('returns default data when fetch returns empty', async () => {
      mockPricesFetch.mockResolvedValue({ prices: [] });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        state,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: {
          prices: [],
          metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
        },
      });
    });
  });
});
