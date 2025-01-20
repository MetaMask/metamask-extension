import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import {
  BUILT_IN_NETWORKS,
  CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { mockNetworkState } from '../../../test/stub/networks';
import mockErc20Erc20Quotes from '../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../test/data/bridge/mock-quotes-native-erc20.json';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
} from '../../../shared/types/bridge';
import {
  getAllBridgeableNetworks,
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getIsBridgeTx,
  getToChain,
  getToChains,
  getToToken,
  getToTokens,
  getValidationErrors,
} from './selectors';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [CHAIN_IDS.ARBITRUM]: { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: '0xe708' },
        metamaskStateOverrides: {
          ...mockNetworkState(FEATURED_RPCS[1]),
        },
      });

      const result = getFromChain(state as never);
      expect(result).toStrictEqual({
        blockExplorerUrls: ['https://localhost/blockExplorer/0xa4b1'],
        chainId: '0xa4b1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: expect.anything(),
            type: 'custom',
            url: 'https://localhost/rpc/0xa4b1',
          },
        ],
      });
    });
  });

  describe('getToChain', () => {
    it('returns the toChain from the state', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              '0xe708': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: '0xe708' },
      });

      const result = getToChain(state as never);

      expect(result).toStrictEqual({
        blockExplorerUrls: ['https://localhost/blockExplorer/0xe708'],
        chainId: '0xe708',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Linea Mainnet',
        rpcEndpoints: [
          {
            networkClientId: expect.anything(),
            type: 'custom',
            url: 'https://localhost/rpc/0xe708',
          },
        ],
        nativeCurrency: 'ETH',
      });
    });
  });

  describe('getAllBridgeableNetworks', () => {
    it('returns list of ALLOWED_BRIDGE_CHAIN_IDS networks', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState(...FEATURED_RPCS),
        },
      });
      const result = getAllBridgeableNetworks(state as never);

      expect(result).toHaveLength(8);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: FEATURED_RPCS[0].chainId }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: FEATURED_RPCS[1].chainId }),
      );
      FEATURED_RPCS.forEach((rpcDefinition, idx) => {
        expect(result[idx]).toStrictEqual(
          expect.objectContaining({
            ...rpcDefinition,
            blockExplorerUrls: [
              `https://localhost/blockExplorer/${rpcDefinition.chainId}`,
            ],
            name: expect.anything(),
            rpcEndpoints: [
              {
                networkClientId: expect.anything(),
                type: 'custom',
                url: `https://localhost/rpc/${rpcDefinition.chainId}`,
              },
            ],
          }),
        );
      });
      result.forEach(({ chainId }) => {
        expect(ALLOWED_BRIDGE_CHAIN_IDS).toContain(chainId);
      });
    });

    it('returns network if included in ALLOWED_BRIDGE_CHAIN_IDS', () => {
      const state = {
        ...createBridgeMockStore(),
        metamask: {
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.MOONBEAM },
          ),
        },
      };
      const result = getAllBridgeableNetworks(state as never);

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(
        result.find(({ chainId }) => chainId === CHAIN_IDS.MOONBEAM),
      ).toStrictEqual(undefined);
    });
  });

  describe('getFromChains', () => {
    it('excludes disabled chains from options', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
              [CHAIN_IDS.LINEA_MAINNET]: {
                isActiveSrc: true,
                isActiveDest: false,
              },
              [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: false },
              [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: CHAIN_IDS.LINEA_MAINNET },
      });
      const result = getFromChains(state as never);

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getFromChains(state as never);

      expect(result).toHaveLength(0);
    });
  });

  describe('getToChains', () => {
    it('includes selected providerConfig and disabled chains from options', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [CHAIN_IDS.ARBITRUM]: { isActiveSrc: false, isActiveDest: true },
              [CHAIN_IDS.LINEA_MAINNET]: {
                isActiveSrc: false,
                isActiveDest: true,
              },
              [CHAIN_IDS.OPTIMISM]: { isActiveSrc: false, isActiveDest: true },
              [CHAIN_IDS.POLYGON]: { isActiveSrc: false, isActiveDest: true },
              [CHAIN_IDS.BSC]: { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        metamaskStateOverrides: {
          ...mockNetworkState(...FEATURED_RPCS),
        },
      });
      const result = getToChains(state as never);

      expect(result).toHaveLength(5);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.ARBITRUM }),
      );
      expect(result[2]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.BSC }),
      );
      expect(result[3]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[4]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getToChains(state as never);

      expect(result).toHaveLength(0);
    });
  });

  describe('getIsBridgeTx', () => {
    it('returns false if bridge is not enabled', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            support: false,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0x38': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: '0x38' },
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: '0x1' }),
        },
      });

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if toChainId is null', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: null },
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: '0x1' }),
        },
      });

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if fromChain and toChainId have the same chainId', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: '0x1' },
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: '0x1' }),
        },
      });

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if useExternalServices is not enabled', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0x38': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: '0x38' },
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: '0x1' }),
        },
      });

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns true if bridge is enabled and fromChain and toChainId have different chainIds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0x38': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: '0x38' },
        metamaskStateOverrides: {
          ...mockNetworkState(
            ...Object.values(BUILT_IN_NETWORKS),
            ...FEATURED_RPCS.filter(
              (network) => network.chainId !== CHAIN_IDS.LINEA_MAINNET, // Linea mainnet is both a built in network, as well as featured RPC
            ),
          ),
          useExternalServices: true,
        },
      });

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(true);
    });
  });

  describe('getFromToken', () => {
    it('returns fromToken', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: { address: '0x123', symbol: 'TEST' },
        },
      });
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns defaultToken if fromToken has no address', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: { symbol: 'NATIVE' },
        },
      });
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        chainId: '0x1',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        image: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
        type: 'NATIVE',
        balance: '0',
        string: '0',
      });
    });

    it('returns defaultToken if fromToken is undefined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { fromToken: undefined },
      });
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        chainId: '0x1',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        image: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
        type: 'NATIVE',
        balance: '0',
        string: '0',
      });
    });
  });

  describe('getToToken', () => {
    it('returns toToken', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toToken: { address: '0x123', symbol: 'TEST' },
        },
      });
      const result = getToToken(state as never);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns undefined if toToken is undefined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toToken: null },
      });
      const result = getToToken(state as never);

      expect(result).toStrictEqual(null);
    });
  });

  describe('getFromAmount', () => {
    it('returns fromTokenInputValue', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { fromTokenInputValue: '123' },
      });
      const result = getFromAmount(state as never);

      expect(result).toStrictEqual('123');
    });

    it('returns empty string', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { fromTokenInputValue: '' },
      });
      const result = getFromAmount(state as never);

      expect(result).toStrictEqual('');
    });
  });

  describe('getToTokens', () => {
    it('returns dest tokens from controller state when toChainId is defined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: '0x1' },
        bridgeStateOverrides: {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
        },
      });
      const result = getToTokens(state as never);

      expect(result).toStrictEqual({
        isLoading: false,
        toTokens: {
          '0x00': { address: '0x00', symbol: 'TEST' },
        },
        toTopAssets: [],
      });
    });

    it('returns dest top assets from controller state when toChainId is defined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: '0x1' },
        bridgeStateOverrides: {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          destTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
      });
      const result = getToTokens(state as never);

      expect(result.toTopAssets).toStrictEqual([
        { address: '0x00', symbol: 'TEST' },
      ]);
    });
  });

  describe('getBridgeQuotes', () => {
    it('returns quote list and fetch data, insufficientBal=false,quotesRefreshCount=5', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            maxRefreshCount: 5,
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: '0x89',
          fromTokenExchangeRate: 1,
          fromToken: { address: zeroAddress(), symbol: 'TEST' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          toTokenExchangeRate: 0.99,
          toNativeExchangeRate: 0.354073,
        },
        bridgeStateOverrides: {
          quoteRequest: { insufficientBal: false },
          quotes: mockErc20Erc20Quotes,
          quotesFetchStatus: 1,
          quotesRefreshCount: 5,
          quotesLastFetched: 100,
          quotesInitialLoadTime: 11000,
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 1,
              usdConversionRate: 1,
            },
            POL: {
              conversionRate: 1,
              usdConversionRate: 1,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
            { chainId: CHAIN_IDS.OPTIMISM },
          ),
        },
      });

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          valueInCurrency: expect.any(Object),
        },
        cost: { valueInCurrency: new BigNumber('0.15656287141025952') },
        sentAmount: {
          valueInCurrency: new BigNumber('14'),
          amount: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          valueInCurrency: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          amountMax: new BigNumber('9.933761952e-8'),
          valueInCurrency: new BigNumber('7.141025952e-8'),
          valueInCurrencyMax: new BigNumber('9.933761952e-8'),
        },
        totalMaxNetworkFee: {
          amount: new BigNumber('0.00100009933761952'),
          valueInCurrency: new BigNumber('0.00100009933761952'),
        },
        totalNetworkFee: {
          valueInCurrency: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
        },
      };

      const result = getBridgeQuotes(state as never);
      expect(result.sortedQuotes).toHaveLength(2);
      expect(result).toStrictEqual({
        sortedQuotes: expect.any(Array),
        recommendedQuote: {
          ...mockErc20Erc20Quotes[0],
          ...recommendedQuoteMetadata,
        },
        activeQuote: {
          ...mockErc20Erc20Quotes[0],
          ...recommendedQuoteMetadata,
        },
        quotesLastFetchedMs: 100,
        isLoading: false,
        quotesRefreshCount: 5,
        quotesInitialLoadTimeMs: 11000,
        isQuoteGoingToRefresh: false,
        quoteFetchError: undefined,
      });
    });

    it('returns quote list and fetch data, insufficientBal=false,quotesRefreshCount=2', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            maxRefreshCount: 5,
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: '0x89',
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 1,
          toTokenExchangeRate: 0.99,
        },
        bridgeStateOverrides: {
          quoteRequest: { insufficientBal: false },
          quotes: mockErc20Erc20Quotes,
          quotesFetchStatus: 1,
          quotesRefreshCount: 2,
          quotesInitialLoadTime: 11000,
          quotesLastFetched: 100,
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 1,
            },
            POL: {
              conversionRate: 0.354073,
              usdConversionRate: 1,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
            { chainId: CHAIN_IDS.OPTIMISM },
          ),
        },
      });
      const result = getBridgeQuotes(state as never);

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          valueInCurrency: new BigNumber('13.843437128589739081572'),
        },
        cost: { valueInCurrency: new BigNumber('0.156562871410260918428') },
        sentAmount: {
          valueInCurrency: new BigNumber('14'),
          amount: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          valueInCurrency: new BigNumber('13.844437199999998601572'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          amountMax: new BigNumber('9.933761952e-8'),
          valueInCurrency: new BigNumber('7.141025952e-8'),
          valueInCurrencyMax: new BigNumber('9.933761952e-8'),
        },
        totalNetworkFee: {
          valueInCurrency: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
        },
        totalMaxNetworkFee: {
          valueInCurrency: new BigNumber('0.00100009933761952'),
          amount: new BigNumber('0.00100009933761952'),
        },
      };
      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        { valueInCurrency: new BigNumber('0.156562871410260918428') },
        { valueInCurrency: new BigNumber('0.33900008283534602') },
      ];
      result.sortedQuotes.forEach(
        (quote: QuoteMetadata & QuoteResponse, idx: number) => {
          expect(quote.cost).toStrictEqual(EXPECTED_SORTED_COSTS[idx]);
        },
      );
      expect(result).toStrictEqual({
        sortedQuotes: expect.any(Array),
        recommendedQuote: {
          ...mockErc20Erc20Quotes[0],
          ...recommendedQuoteMetadata,
        },
        activeQuote: {
          ...mockErc20Erc20Quotes[0],
          ...recommendedQuoteMetadata,
        },
        quotesLastFetchedMs: 100,
        isLoading: false,
        quotesRefreshCount: 2,
        isQuoteGoingToRefresh: true,
        quotesInitialLoadTimeMs: 11000,
        quoteFetchError: undefined,
      });
    });

    it('returns quote list and fetch data, insufficientBal=true', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            maxRefreshCount: 5,
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: '0x89',
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 1,
          toTokenExchangeRate: 0.99,
        },
        bridgeStateOverrides: {
          quoteRequest: { insufficientBal: true },
          quotes: mockErc20Erc20Quotes,
          quotesFetchStatus: 1,
          quotesRefreshCount: 1,
          quotesLastFetched: 100,
          quotesInitialLoadTime: 11000,
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 1,
            },
            POL: {
              conversionRate: 1,
              usdConversionRate: 1,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
            { chainId: CHAIN_IDS.OPTIMISM },
          ),
        },
      });
      const result = getBridgeQuotes(state as never);

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          valueInCurrency: new BigNumber('13.84343712858974048'),
        },
        cost: { valueInCurrency: new BigNumber('0.15656287141025952') },
        sentAmount: {
          valueInCurrency: new BigNumber('14'),
          amount: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          valueInCurrency: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          amountMax: new BigNumber('9.933761952e-8'),
          valueInCurrency: new BigNumber('7.141025952e-8'),
          valueInCurrencyMax: new BigNumber('9.933761952e-8'),
        },
        totalNetworkFee: {
          valueInCurrency: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
        },
        totalMaxNetworkFee: {
          valueInCurrency: new BigNumber('0.00100009933761952'),
          amount: new BigNumber('0.00100009933761952'),
        },
      };
      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        { valueInCurrency: new BigNumber('0.15656287141025952') },
        { valueInCurrency: new BigNumber('0.33900008283534464') },
      ];
      result.sortedQuotes.forEach(
        (quote: QuoteMetadata & QuoteResponse, idx: number) => {
          expect(quote.cost).toStrictEqual(EXPECTED_SORTED_COSTS[idx]);
        },
      );

      expect(result).toStrictEqual({
        sortedQuotes: expect.any(Array),
        recommendedQuote: {
          ...mockErc20Erc20Quotes[0],
          ...recommendedQuoteMetadata,
        },
        activeQuote: {
          ...mockErc20Erc20Quotes[0],
          ...recommendedQuoteMetadata,
        },
        quotesLastFetchedMs: 100,
        quotesInitialLoadTimeMs: 11000,
        isLoading: false,
        quotesRefreshCount: 1,
        isQuoteGoingToRefresh: false,
        quoteFetchError: undefined,
      });
    });
  });

  describe('getBridgeQuotes', () => {
    it('should return empty values when quotes are not present', () => {
      const state = createBridgeMockStore();

      const result = getBridgeQuotes(state as never);

      expect(result).toStrictEqual({
        activeQuote: undefined,
        isLoading: false,
        isQuoteGoingToRefresh: false,
        quotesLastFetchedMs: undefined,
        quotesRefreshCount: 0,
        recommendedQuote: undefined,
        quotesInitialLoadTimeMs: undefined,
        sortedQuotes: [],
        quoteFetchError: undefined,
      });
    });

    it('should sort quotes by adjustedReturn', () => {
      const state = createBridgeMockStore({
        bridgeStateOverrides: { quotes: mockBridgeQuotesNativeErc20 },
      });

      const { activeQuote, recommendedQuote, sortedQuotes } = getBridgeQuotes(
        state as never,
      );

      const quoteMetadataKeys = [
        'adjustedReturn',
        'toTokenAmount',
        'sentAmount',
        'totalNetworkFee',
        'swapRate',
      ];
      expect(
        quoteMetadataKeys.every((k) =>
          Object.keys(activeQuote ?? {}).includes(k),
        ),
      ).toBe(true);
      expect(activeQuote?.quote.requestId).toStrictEqual(
        '381c23bc-e3e4-48fe-bc53-257471e388ad',
      );
      expect(recommendedQuote?.quote.requestId).toStrictEqual(
        '381c23bc-e3e4-48fe-bc53-257471e388ad',
      );
      expect(sortedQuotes).toHaveLength(2);
      sortedQuotes.forEach(
        (quote: QuoteMetadata & QuoteResponse, idx: number) => {
          expect(
            quoteMetadataKeys.every((k) =>
              Object.keys(quote ?? {}).includes(k),
            ),
          ).toBe(true);
          expect(quote?.quote.requestId).toStrictEqual(
            mockBridgeQuotesNativeErc20[idx]?.quote.requestId,
          );
        },
      );
    });

    it('should sort quotes by ETA', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { sortOrder: SortOrder.ETA_ASC },
        bridgeStateOverrides: {
          quotes: [
            ...mockBridgeQuotesNativeErc20,
            {
              ...mockBridgeQuotesNativeErc20[0],
              estimatedProcessingTimeInSeconds: 1,
              quote: {
                ...mockBridgeQuotesNativeErc20[0].quote,
                requestId: 'fastestQuote',
              },
            },
          ],
        },
      });

      const { activeQuote, recommendedQuote, sortedQuotes } = getBridgeQuotes(
        state as never,
      );

      expect(activeQuote?.quote.requestId).toStrictEqual('fastestQuote');
      expect(recommendedQuote?.quote.requestId).toStrictEqual('fastestQuote');
      expect(sortedQuotes).toHaveLength(3);
      expect(sortedQuotes[0]?.quote.requestId).toStrictEqual('fastestQuote');
      expect(sortedQuotes[1]?.quote.requestId).toStrictEqual(
        mockBridgeQuotesNativeErc20[1]?.quote.requestId,
      );
      expect(sortedQuotes[2]?.quote.requestId).toStrictEqual(
        mockBridgeQuotesNativeErc20[0]?.quote.requestId,
      );
    });
  });

  describe('getValidationErrors', () => {
    it('should return isNoQuotesAvailable=true', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: '0x1' },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotes: [],
          quotesLastFetched: Date.now(),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isNoQuotesAvailable).toStrictEqual(true);
    });

    it('should  return isNoQuotesAvailable=false on initial load', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: '0x1' },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotes: [],
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isNoQuotesAvailable).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=true', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromToken: { decimals: 6, address: zeroAddress() },
          fromChain: { chainId: CHAIN_IDS.MAINNET },
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quoteRequest: { srcTokenAmount: '1000' },
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        result.isInsufficientBalance(new BigNumber(0.00099)),
      ).toStrictEqual(true);
    });

    it('should return isInsufficientBalance=false when there is no input amount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: '0x1' },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        result.isInsufficientBalance(new BigNumber(0.00099)),
      ).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=false when there is no balance', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: '0x1' },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientBalance()).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=false when balance is 0', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromToken: { decimals: 6, address: zeroAddress() },
          fromChain: { chainId: CHAIN_IDS.MAINNET },
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quoteRequest: { srcTokenAmount: '1000' },
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientBalance(new BigNumber(0))).toStrictEqual(
        true,
      );
    });

    it('should return isInsufficientGasBalance=true when balance is equal to srcAmount and fromToken is native', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromTokenInputValue: '0.001',
          fromToken: { address: zeroAddress(), decimals: 18 },
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quoteRequest: { srcTokenAmount: '10000000000000000' },
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        result.isInsufficientGasBalance(new BigNumber(0.01)),
      ).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=true when balance is 0 and fromToken is erc20', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: { destNetworkAllowlist: ['0x89'] },
        bridgeSliceOverrides: {
          toChainId: '0x89',
          toToken: {
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            symbol: 'TEST',
          },
          fromTokenInputValue: '0.001',
          fromToken: {
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            decimals: 6,
          },
          toTokenExchangeRate: 0.798781,
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quoteRequest: { srcTokenAmount: '100000000' },
        },
        metamaskStateOverrides: {
          currencyRates: {
            POL: {
              conversionRate: 0.354073,
              usdConversionRate: 1,
            },
          },
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance(new BigNumber(0))).toStrictEqual(
        true,
      );
    });

    it('should return isInsufficientGasBalance=false if there is no fromAmount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromTokenInputValue: '0.001',
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quoteRequest: {},
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance(new BigNumber(0))).toStrictEqual(
        false,
      );
    });

    it('should return isInsufficientGasBalance=false when quotes have been loaded', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromTokenInputValue: '0.001',
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quotes: mockErc20Erc20Quotes,
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance(new BigNumber(0))).toStrictEqual(
        false,
      );
    });

    it('should return isInsufficientGasForQuote=true when balance is less than required network fees in quote', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromTokenInputValue: '0.001',
          fromToken: { address: zeroAddress(), decimals: 18 },
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quotes: mockBridgeQuotesNativeErc20,
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee.amount,
      ).toStrictEqual(new BigNumber('0.00100012486628784'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.amount,
      ).toStrictEqual(new BigNumber('0.01'));
      expect(
        result.isInsufficientGasForQuote(new BigNumber(0.001)),
      ).toStrictEqual(true);
    });

    it('should return isInsufficientGasForQuote=false when balance is greater than max network fees in quote', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: '0x1',
          fromTokenInputValue: '0.001',
          fromToken: { address: zeroAddress(), decimals: 18 },
        },
        bridgeStateOverrides: {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
          quotesLastFetched: Date.now(),
          quotes: mockBridgeQuotesNativeErc20,
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee.amount,
      ).toStrictEqual(new BigNumber('0.00100012486628784'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.totalMaxNetworkFee.amount,
      ).toStrictEqual(new BigNumber('0.00100017369940784'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.amount,
      ).toStrictEqual(new BigNumber('0.01'));
      expect(
        result.isInsufficientGasForQuote(new BigNumber('1')),
      ).toStrictEqual(false);
    });

    it('should return isEstimatedReturnLow=true return value is 50% less than sent funds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: '0x89',
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenInputValue: '1',
          fromTokenExchangeRate: 2524.25,
          toTokenExchangeRate: 0.61,
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20,
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
            },
            POL: {
              conversionRate: 0.354073,
              usdConversionRate: 1,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
            { chainId: CHAIN_IDS.OPTIMISM },
          ),
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.valueInCurrency,
      ).toStrictEqual(new BigNumber('25.2425'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee
          .valueInCurrency,
      ).toStrictEqual(new BigNumber('2.52456519372708012'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.adjustedReturn
          .valueInCurrency,
      ).toStrictEqual(new BigNumber('12.38316502627291988'));
      expect(result.isEstimatedReturnLow).toStrictEqual(true);
    });

    it('should return isEstimatedReturnLow=false when return value is more than 50% of sent funds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: '0x89',
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 2524.25,
          toTokenExchangeRate: 0.63,
          fromTokenInputValue: 1,
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20,
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
              usdConversionRate: 1,
            },
            POL: {
              conversionRate: 1,
              usdConversionRate: 1,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
            { chainId: CHAIN_IDS.OPTIMISM },
          ),
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.valueInCurrency,
      ).toStrictEqual(new BigNumber('25.2425'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee
          .valueInCurrency,
      ).toStrictEqual(new BigNumber('2.52456519372708012'));
      expect(
        getBridgeQuotes(state as never).activeQuote?.adjustedReturn
          .valueInCurrency,
      ).toStrictEqual(new BigNumber('12.87194306627291988'));
      expect(result.isEstimatedReturnLow).toStrictEqual(false);
    });

    it('should return isEstimatedReturnLow=false if there are no quotes', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toTokenExchangeRate: 0.998781,
          toNativeExchangeRate: 0.354073,
        },
        bridgeStateOverrides: {
          quotes: [],
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
            },
          },
        },
      });
      const result = getValidationErrors(state as never);

      expect(getBridgeQuotes(state as never).activeQuote).toStrictEqual(
        undefined,
      );
      expect(result.isEstimatedReturnLow).toStrictEqual(false);
    });
  });
});
