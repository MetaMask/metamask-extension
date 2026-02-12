/* eslint-disable @typescript-eslint/no-explicit-any */
import { EthScope, SolScope } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  DEFAULT_USE_HISTORICAL_PRICES_METADATA,
  useHistoricalPrices,
} from './useHistoricalPrices';

// Mock global fetch since fetchWithCache was replaced with fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

/**
 * In these tests, we represent the price data with 1 point per day, to simplify the mocks.
 * For instance:
 * - P1D: [1, 100]
 * - P7D: [1, 100], [2, 102], [3, 102], [4, 105], [5, 99], [6, 102], [7, 100]
 */

describe('useHistoricalPrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Base state with generic data. We will extend / override this for each test.
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
          rpcEndpoints: [
            {
              networkClientId: 'selectedNetworkClientId',
            },
          ],
        },
        [SolScope.Mainnet]: {
          chainId: SolScope.Mainnet,
          name: 'Solana',
          nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
          isEvm: false,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'selectedNetworkClientId2',
            },
          ],
        },
      },
      currencyRates: {
        ETH: {
          conversionRate: 1,
        },
      },
      useCurrencyRateCheck: true,
      internalAccounts: {
        accounts: {
          '81b1ead4-334c-4921-9adf-282fde539752': {
            id: '81b1ead4-334c-4921-9adf-282fde539752',
            address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
            type: 'eip155:eoa',
            scopes: [EthScope.Eoa],
          },
          '5132883f-598e-482c-a02b-84eeaa352f5b': {
            id: '5132883f-598e-482c-a02b-84eeaa352f5b',
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
            scopes: [SolScope.Mainnet],
          },
        },
        selectedAccount: '', // To be set in each test
      },
      accountTree: {
        selectedAccountGroup: 'entropy:wallet1/0',
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

  describe('when the chain is EVM', () => {
    const mockStateIsEvm = cloneDeep(mockBaseState);
    mockStateIsEvm.metamask.internalAccounts.selectedAccount =
      '81b1ead4-334c-4921-9adf-282fde539752';

    const chainId = '0x1';
    const address = '0x458036e7bc0612e9b207640dc07ca7711346aae5';
    const currency = 'usd';
    const timeRange = 'P7D';

    it('returns loading true and default data initially', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ prices: [] }),
      });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        mockStateIsEvm,
      );

      expect(result.current).toEqual({
        loading: true,
        data: {
          prices: [],
          metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
        },
      });
    });

    it('returns the historical prices when the prices are fetched successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            prices: [
              [1, 100],
              [2, 102],
              [3, 102],
              [4, 105],
              [5, 99],
              [6, 102],
              [7, 100],
            ],
          }),
      });

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        mockStateIsEvm,
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: {
          prices: [
            { x: 1, y: 100 },
            { x: 2, y: 102 },
            { x: 3, y: 102 },
            { x: 4, y: 105 },
            { x: 5, y: 99 },
            { x: 6, y: 102 },
            { x: 7, y: 100 },
          ],
          metadata: {
            minPricePoint: { x: 5, y: 99 },
            maxPricePoint: { x: 4, y: 105 },
            xMin: 1,
            xMax: 7,
            yMin: 99,
            yMax: 105,
          },
        },
      });
    });

    it('returns default data when the prices are not fetched successfully', async () => {
      mockFetch.mockRejectedValue(new Error('Error'));

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        mockStateIsEvm,
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

    it('returns default data when the chain does not support pricing', async () => {
      const _chainId = '0x9999';
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ prices: [] }),
      });
      // Replace mainnet with a new chain id that does not support pricing
      const mockState = cloneDeep(mockStateIsEvm) as any;
      mockState.metamask.networkConfigurationsByChainId = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _chainId: {
          ...mockState.metamask.networkConfigurationsByChainId['0x1'],
          chainId: _chainId,
        },
      };

      const { result } = renderHookWithProvider(
        () =>
          useHistoricalPrices({
            chainId: _chainId,
            address,
            currency,
            timeRange,
          }),
        mockState,
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

  describe('when the chain is non-EVM', () => {
    const mockStateIsNonEvm = cloneDeep(mockBaseState);
    mockStateIsNonEvm.metamask.internalAccounts.selectedAccount =
      '5132883f-598e-482c-a02b-84eeaa352f5b';

    const chainId = SolScope.Mainnet;
    const address = '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC';
    const currency = 'usd';
    const timeRange = 'P7D';

    it('returns loading true and default data initially', () => {
      const mockState = cloneDeep(mockStateIsNonEvm) as any;
      mockState.metamask.historicalPrices = {};

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        mockStateIsNonEvm,
      );

      expect(result.current).toEqual({
        loading: true,
        data: {
          prices: [],
          metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
        },
      });
    });

    it('returns the historical prices when the state is populated', async () => {
      const mockState = cloneDeep(mockStateIsNonEvm) as any;
      mockState.metamask.historicalPrices = {
        '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC': {
          usd: {
            intervals: {
              P1D: [[1, 100]],
              P7D: [
                [1, 100],
                [2, 102],
                [3, 102],
                [4, 105],
                [5, 99],
                [6, 102],
                [7, 100],
              ],
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        mockState,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: {
          prices: [
            { x: 1, y: 100 },
            { x: 2, y: 102 },
            { x: 3, y: 102 },
            { x: 4, y: 105 },
            { x: 5, y: 99 },
            { x: 6, y: 102 },
            { x: 7, y: 100 },
          ],
          metadata: {
            minPricePoint: { x: 5, y: 99 },
            maxPricePoint: { x: 4, y: 105 },
            xMin: 1,
            xMax: 7,
            yMin: 99,
            yMax: 105,
          },
        },
      });
    });

    it('returns default data when the state is not populated', async () => {
      const mockState = cloneDeep(mockStateIsNonEvm) as any;
      mockState.metamask.historicalPrices = {};

      const { result } = renderHookWithProvider(
        () => useHistoricalPrices({ chainId, address, currency, timeRange }),
        mockState,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toEqual({
        loading: false,
        data: { prices: [], metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA },
      });
    });
  });
});
