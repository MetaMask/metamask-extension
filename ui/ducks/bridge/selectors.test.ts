import { BigNumber } from 'bignumber.js';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import {
  BUILT_IN_NETWORKS,
  CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  BRIDGE_QUOTE_MAX_ETA_SECONDS,
} from '../../../shared/constants/bridge';
import { mockNetworkState } from '../../../test/stub/networks';
import mockErc20Erc20Quotes from '../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../test/data/bridge/mock-quotes-native-erc20.json';
import { SortOrder } from '../../pages/bridge/types';
import {
  getAllBridgeableNetworks,
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getFromTokens,
  getFromTopAssets,
  getIsBridgeTx,
  getToChain,
  getToChains,
  getToToken,
  getToTokens,
  getToTopAssets,
} from './selectors';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = createBridgeMockStore(
        { srcNetworkAllowlist: [CHAIN_IDS.ARBITRUM] },
        { toChainId: '0xe708' },
        {},
        { ...mockNetworkState(FEATURED_RPCS[1]) },
      );

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
      const state = createBridgeMockStore(
        { destNetworkAllowlist: ['0xe708'] },
        { toChainId: '0xe708' },
      );

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
      const state = createBridgeMockStore(
        {},
        {},
        {},
        mockNetworkState(...FEATURED_RPCS),
      );
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
      const state = createBridgeMockStore(
        {
          srcNetworkAllowlist: [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.LINEA_MAINNET,
            CHAIN_IDS.OPTIMISM,
            CHAIN_IDS.POLYGON,
          ],
        },
        { toChainId: CHAIN_IDS.LINEA_MAINNET },
      );
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
    it('excludes selected providerConfig and disabled chains from options', () => {
      const state = createBridgeMockStore(
        {
          destNetworkAllowlist: [
            CHAIN_IDS.ARBITRUM,
            CHAIN_IDS.LINEA_MAINNET,
            CHAIN_IDS.OPTIMISM,
            CHAIN_IDS.POLYGON,
          ],
        },
        {},
        {},
        mockNetworkState(...FEATURED_RPCS),
      );
      const result = getToChains(state as never);

      expect(result).toHaveLength(3);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.ARBITRUM }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[2]).toStrictEqual(
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
      const state = createBridgeMockStore(
        {
          extensionSupport: false,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x38'],
        },
        { toChainId: '0x38' },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: true },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if toChainId is null', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x1'],
        },
        { toChainId: null },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: true },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if fromChain and toChainId have the same chainId', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x1'],
        },
        { toChainId: '0x1' },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: true },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if useExternalServices is not enabled', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x38'],
        },
        { toChainId: '0x38' },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: false },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns true if bridge is enabled and fromChain and toChainId have different chainIds', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x38'],
        },
        { toChainId: '0x38' },
        {},
        {
          ...mockNetworkState(
            ...Object.values(BUILT_IN_NETWORKS),
            ...FEATURED_RPCS.filter(
              (network) => network.chainId !== CHAIN_IDS.LINEA_MAINNET, // Linea mainnet is both a built in network, as well as featured RPC
            ),
          ),
          useExternalServices: true,
        },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(true);
    });
  });

  describe('getFromToken', () => {
    it('returns fromToken', () => {
      const state = createBridgeMockStore(
        {},

        { fromToken: { address: '0x123', symbol: 'TEST' } },
      );
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns defaultToken if fromToken has no address', () => {
      const state = createBridgeMockStore(
        {},
        { fromToken: { symbol: 'NATIVE' } },
      );
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        balance: '0',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        string: '0',
        symbol: 'ETH',
      });
    });

    it('returns defaultToken if fromToken is undefined', () => {
      const state = createBridgeMockStore({}, { fromToken: undefined });
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        balance: '0',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        string: '0',
        symbol: 'ETH',
      });
    });
  });

  describe('getToToken', () => {
    it('returns toToken', () => {
      const state = createBridgeMockStore(
        {},
        { toToken: { address: '0x123', symbol: 'TEST' } },
      );
      const result = getToToken(state as never);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns undefined if toToken is undefined', () => {
      const state = createBridgeMockStore({}, { toToken: null });
      const result = getToToken(state as never);

      expect(result).toStrictEqual(null);
    });
  });

  describe('getFromAmount', () => {
    it('returns fromTokenInputValue', () => {
      const state = createBridgeMockStore({}, { fromTokenInputValue: '123' });
      const result = getFromAmount(state as never);

      expect(result).toStrictEqual('123');
    });

    it('returns empty string', () => {
      const state = createBridgeMockStore({}, { fromTokenInputValue: '' });
      const result = getFromAmount(state as never);

      expect(result).toStrictEqual('');
    });
  });

  describe('getToTokens', () => {
    it('returns dest tokens from controller state when toChainId is defined', () => {
      const state = createBridgeMockStore(
        {},
        { toChainId: '0x1' },
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
        },
      );
      const result = getToTokens(state as never);

      expect(result).toStrictEqual({
        '0x00': { address: '0x00', symbol: 'TEST' },
      });
    });

    it('returns empty dest tokens from controller state when toChainId is undefined', () => {
      const state = createBridgeMockStore(
        {},
        {},
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
        },
      );
      const result = getToTokens(state as never);

      expect(result).toStrictEqual({});
    });
  });

  describe('getToTopAssets', () => {
    it('returns dest top assets from controller state when toChainId is defined', () => {
      const state = createBridgeMockStore(
        {},
        { toChainId: '0x1' },
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          destTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
      );
      const result = getToTopAssets(state as never);

      expect(result).toStrictEqual([{ address: '0x00', symbol: 'TEST' }]);
    });

    it('returns empty dest top assets from controller state when toChainId is undefined', () => {
      const state = createBridgeMockStore(
        {},
        {},
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          destTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
      );
      const result = getToTopAssets(state as never);

      expect(result).toStrictEqual([]);
    });
  });

  describe('getFromTokens', () => {
    it('returns src tokens from controller state', () => {
      const state = createBridgeMockStore(
        {},
        { toChainId: '0x1' },
        {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
        },
      );
      const result = getFromTokens(state as never);

      expect(result).toStrictEqual({
        '0x00': { address: '0x00', symbol: 'TEST' },
      });
    });
  });

  describe('getFromTopAssets', () => {
    it('returns src top assets from controller state', () => {
      const state = createBridgeMockStore(
        {},
        { toChainId: '0x1' },
        {
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
      );
      const result = getFromTopAssets(state as never);

      expect(result).toStrictEqual([{ address: '0x00', symbol: 'TEST' }]);
    });
  });

  describe('getBridgeQuotes', () => {
    it('returns quote list and fetch data, insufficientBal=false,quotesRefreshCount=5', () => {
      const state = createBridgeMockStore(
        { extensionConfig: { maxRefreshCount: 5 } },
        {
          toChainId: '0x1',
          fromTokenExchangeRate: 1,
          toTokenExchangeRate: 0.99,
          toNativeExchangeRate: 0.354073,
        },
        {
          quoteRequest: { insufficientBal: false },
          quotes: mockErc20Erc20Quotes,
          quotesFetchStatus: 1,
          quotesRefreshCount: 5,
          quotesLastFetched: 100,
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
        {
          currencyRates: {
            ETH: {
              conversionRate: 1,
            },
          },
        },
      );

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          fiat: expect.any(Object),
        },
        cost: { fiat: new BigNumber('0.15656287141025952') },
        sentAmount: {
          fiat: new BigNumber('14'),
          amount: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          fiat: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          fiat: new BigNumber('7.141025952e-8'),
        },
        totalNetworkFee: {
          fiat: new BigNumber('0.00100007141025952'),
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
        isQuoteGoingToRefresh: false,
      });
    });

    it('returns quote list and fetch data, insufficientBal=false,quotesRefreshCount=2', () => {
      const state = createBridgeMockStore(
        { extensionConfig: { maxRefreshCount: 5 } },
        {
          toChainId: '0x1',
          fromTokenExchangeRate: 1,
          toTokenExchangeRate: 0.99,
          toNativeExchangeRate: 0.354073,
        },
        {
          quoteRequest: { insufficientBal: false },
          quotes: mockErc20Erc20Quotes,
          quotesFetchStatus: 1,
          quotesRefreshCount: 2,
          quotesLastFetched: 100,
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
        {
          currencyRates: {
            ETH: {
              conversionRate: 1,
            },
          },
        },
      );
      const result = getBridgeQuotes(state as never);

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          fiat: new BigNumber('13.84343712858974048'),
        },
        cost: { fiat: new BigNumber('0.15656287141025952') },
        sentAmount: {
          fiat: new BigNumber('14'),
          amount: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          fiat: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          fiat: new BigNumber('7.141025952e-8'),
        },
        totalNetworkFee: {
          fiat: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
        },
      };
      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        { fiat: new BigNumber('0.15656287141025952') },
        { fiat: new BigNumber('0.33900008283534464') },
      ];
      result.sortedQuotes.forEach((quote, idx) => {
        expect(quote.cost).toStrictEqual(EXPECTED_SORTED_COSTS[idx]);
      });
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
      });
    });

    it('returns quote list and fetch data, insufficientBal=true', () => {
      const state = createBridgeMockStore(
        { extensionConfig: { maxRefreshCount: 5 } },
        {
          toChainId: '0x1',
          fromTokenExchangeRate: 1,
          toTokenExchangeRate: 0.99,
          toNativeExchangeRate: 0.354073,
        },
        {
          quoteRequest: { insufficientBal: true },
          quotes: mockErc20Erc20Quotes,
          quotesFetchStatus: 1,
          quotesRefreshCount: 1,
          quotesLastFetched: 100,
          srcTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          srcTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
        {
          currencyRates: {
            ETH: {
              conversionRate: 1,
            },
          },
        },
      );
      const result = getBridgeQuotes(state as never);

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          fiat: new BigNumber('13.84343712858974048'),
        },
        cost: { fiat: new BigNumber('0.15656287141025952') },
        sentAmount: {
          fiat: new BigNumber('14'),
          amount: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          fiat: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          fiat: new BigNumber('7.141025952e-8'),
        },
        totalNetworkFee: {
          fiat: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
        },
      };
      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        { fiat: new BigNumber('0.15656287141025952') },
        { fiat: new BigNumber('0.33900008283534464') },
      ];
      result.sortedQuotes.forEach((quote, idx) => {
        expect(quote.cost).toStrictEqual(EXPECTED_SORTED_COSTS[idx]);
      });

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
        quotesRefreshCount: 1,
        isQuoteGoingToRefresh: false,
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
        quotesRefreshCount: undefined,
        recommendedQuote: undefined,
        sortedQuotes: [],
      });
    });

    it('should sort quotes by adjustedReturn', () => {
      const state = createBridgeMockStore(
        {},
        {},
        { quotes: mockBridgeQuotesNativeErc20 },
      );

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
      sortedQuotes.forEach((quote, idx) => {
        expect(
          quoteMetadataKeys.every((k) => Object.keys(quote ?? {}).includes(k)),
        ).toBe(true);
        expect(quote?.quote.requestId).toStrictEqual(
          mockBridgeQuotesNativeErc20[idx]?.quote.requestId,
        );
      });
    });

    it('should sort quotes by ETA', () => {
      const state = createBridgeMockStore(
        {},
        { sortOrder: SortOrder.ETA_ASC },
        {
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
      );

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

    it('should recommend 2nd cheapest quote if ETA exceeds 1 hour', () => {
      const state = createBridgeMockStore(
        {},
        { sortOrder: SortOrder.COST_ASC },
        {
          quotes: [
            mockBridgeQuotesNativeErc20[1],
            {
              ...mockBridgeQuotesNativeErc20[0],
              estimatedProcessingTimeInSeconds:
                BRIDGE_QUOTE_MAX_ETA_SECONDS + 1,
              quote: {
                ...mockBridgeQuotesNativeErc20[0].quote,
                requestId: 'cheapestQuoteWithLongETA',
              },
            },
          ],
        },
      );

      const { activeQuote, recommendedQuote, sortedQuotes } = getBridgeQuotes(
        state as never,
      );

      expect(activeQuote?.quote.requestId).toStrictEqual(
        '4277a368-40d7-4e82-aa67-74f29dc5f98a',
      );
      expect(recommendedQuote?.quote.requestId).toStrictEqual(
        '4277a368-40d7-4e82-aa67-74f29dc5f98a',
      );
      expect(sortedQuotes).toHaveLength(2);
      expect(sortedQuotes[0]?.quote.requestId).toStrictEqual(
        '4277a368-40d7-4e82-aa67-74f29dc5f98a',
      );
      expect(sortedQuotes[1]?.quote.requestId).toStrictEqual(
        'cheapestQuoteWithLongETA',
      );
    });

    it('should recommend 2nd fastest quote if adjustedReturn is less than 80% of cheapest quote', () => {
      const state = createBridgeMockStore(
        {},
        {
          sortOrder: SortOrder.ETA_ASC,
          toTokenExchangeRate: 0.998781,
          toNativeExchangeRate: 0.354073,
        },
        {
          quotes: [
            ...mockBridgeQuotesNativeErc20,
            {
              ...mockBridgeQuotesNativeErc20[0],
              estimatedProcessingTimeInSeconds: 1,
              quote: {
                ...mockBridgeQuotesNativeErc20[0].quote,
                requestId: 'fastestQuote',
                destTokenAmount: '1',
              },
            },
          ],
        },
        {
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
            },
          },
        },
      );

      const { activeQuote, recommendedQuote, sortedQuotes } = getBridgeQuotes(
        state as never,
      );
      const {
        sentAmount,
        totalNetworkFee,
        toTokenAmount,
        adjustedReturn,
        cost,
      } = activeQuote ?? {};

      expect(activeQuote?.quote.requestId).toStrictEqual(
        '4277a368-40d7-4e82-aa67-74f29dc5f98a',
      );
      expect(recommendedQuote?.quote.requestId).toStrictEqual(
        '4277a368-40d7-4e82-aa67-74f29dc5f98a',
      );
      expect(sentAmount?.fiat?.toString()).toStrictEqual('25.2425');
      expect(totalNetworkFee?.fiat?.toString()).toStrictEqual(
        '2.52459306428938562',
      );
      expect(toTokenAmount?.fiat?.toString()).toStrictEqual('24.226654664163');
      expect(adjustedReturn?.fiat?.toString()).toStrictEqual(
        '21.70206159987361438',
      );
      expect(cost?.fiat?.toString()).toStrictEqual('3.54043840012638562');
      expect(sortedQuotes).toHaveLength(3);
      expect(sortedQuotes[0]?.quote.requestId).toStrictEqual('fastestQuote');
      expect(sortedQuotes[1]?.quote.requestId).toStrictEqual(
        '4277a368-40d7-4e82-aa67-74f29dc5f98a',
      );
      expect(sortedQuotes[2]?.quote.requestId).toStrictEqual(
        '381c23bc-e3e4-48fe-bc53-257471e388ad',
      );
    });
  });
});
