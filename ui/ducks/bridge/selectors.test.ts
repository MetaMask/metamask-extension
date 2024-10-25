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
import { mockBridgeQuotesNativeErc20 } from '../../../test/data/bridge/mock-quotes-native-erc20';
import { SortOrder } from '../../pages/bridge/types';
import {
  getAllBridgeableNetworks,
  getApprovalGasMultipliers,
  getBridgeGasMultipliers,
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getFromTokens,
  getFromTopAssets,
  getIsBridgeTx,
  getToAmount,
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

  describe('getToAmount', () => {
    it('returns hardcoded 0', () => {
      const state = createBridgeMockStore();
      const result = getToAmount(state as never);

      expect(result).toStrictEqual(undefined);
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

  describe('getApprovalGasMultipliers', () => {
    it('returns approval gas multipliers when present', () => {
      const state = createBridgeMockStore(
        {
          approvalGasMultiplier: {
            [CHAIN_IDS.MAINNET]: 1.1,
            [CHAIN_IDS.LINEA_MAINNET]: 1.2,
          },
        },
        {},
        {},
        {},
      );
      const result = getApprovalGasMultipliers(state as never);
      expect(result).toStrictEqual({
        [CHAIN_IDS.MAINNET]: 1.1,
        [CHAIN_IDS.LINEA_MAINNET]: 1.2,
      });
    });

    it('returns an empty object when approval gas multipliers are not present', () => {
      const state = createBridgeMockStore();
      const result = getApprovalGasMultipliers(state as never);
      expect(result).toStrictEqual({});
    });
  });

  describe('getBridgeGasMultipliers', () => {
    it('should return bridge gas multipliers when present', () => {
      const state = createBridgeMockStore(
        {
          bridgeGasMultiplier: {
            [CHAIN_IDS.MAINNET]: 1.1,
            [CHAIN_IDS.LINEA_MAINNET]: 1.2,
          },
        },
        {},
        {},
        {},
      );

      const result = getBridgeGasMultipliers(state as never);
      expect(result).toStrictEqual({
        [CHAIN_IDS.MAINNET]: 1.1,
        [CHAIN_IDS.LINEA_MAINNET]: 1.2,
      });
    });

    it('should return an empty object when bridge gas multipliers are not present', () => {
      const state = createBridgeMockStore();
      const result = getBridgeGasMultipliers(state as never);
      expect(result).toStrictEqual({});
    });
  });

  describe('getBridgeQuotes', () => {
    it('should return empty values when quotes are not present', () => {
      const state = createBridgeMockStore();

      const result = getBridgeQuotes(state as never);

      expect(result).toStrictEqual({
        activeQuote: undefined,
        isLoading: false,
        quotesLastFetchedMs: undefined,
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
        { sortOrder: SortOrder.ADJUSTED_RETURN_DESC },
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
      expect(cost?.fiat?.toString()).toStrictEqual('-3.54043840012638562');
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
