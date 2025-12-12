import { zeroAddress } from 'ethereumjs-util';
import {
  ChainId,
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { SolAccountType, SolScope } from '@metamask/keyring-api';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import mockErc20Erc20Quotes from '../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../test/data/bridge/mock-quotes-native-erc20.json';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getIsSwap,
  getToChain,
  getToChains,
  getToToken,
  getValidationErrors,
  getFromTokenConversionRate,
  getFromTokenBalance,
  getFromAccount,
  getIsGasIncluded,
} from './selectors';
import { toBridgeToken } from './utils';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [CHAIN_IDS.ARBITRUM]: { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0xe708') },
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
        name: 'Arbitrum',
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

    it('returns solana network', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
          },
        },
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
          },
          balances: {
            'bf13d52c-d6e8-40ea-9726-07d7149a3ca5': {
              [getNativeAssetForChainId(MultichainNetworks.SOLANA).assetId]: {
                amount: '2',
              },
            },
          },
        },
      });

      const result = getFromChain(state as never);
      expect(result).toStrictEqual(
        expect.objectContaining({
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        }),
      );
    });
  });

  describe('getToChain', () => {
    it('returns the toChain from the state', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              '0xe708': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0xe708') },
      });

      const result = getToChain(state as never);

      expect(result).toStrictEqual({
        blockExplorerUrls: ['https://localhost/blockExplorer/0xe708'],
        chainId: '0xe708',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Linea',
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

    it('returns the fromChain if toChainId is not set', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: true },
              '0xe708': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: { toChainId: null },
      });

      const result = getToChain(state as never);

      expect(result).toStrictEqual({
        blockExplorerUrls: ['https://localhost/blockExplorer/0x1'],
        chainId: '0x1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Ethereum',
        rpcEndpoints: [
          {
            networkClientId: expect.anything(),
            type: 'custom',
            url: 'https://localhost/rpc/0x1',
          },
        ],
        nativeCurrency: 'ETH',
      });
    });
  });

  describe('getFromChains', () => {
    it('excludes disabled chains from options', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
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
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
        },
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
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [CHAIN_IDS.MAINNET]: { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
      });
      const result = getFromChains(state as never);

      expect(result).toHaveLength(0);
    });
  });

  describe('getToChains', () => {
    it('includes selected providerConfig and disabled chains from options', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
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
      expect(result).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ chainId: CHAIN_IDS.BSC }),
          expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
          expect.objectContaining({ chainId: CHAIN_IDS.ARBITRUM }),
          expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
          expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
        ]),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getToChains(state as never);

      expect(result).toHaveLength(0);
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
        accountType: undefined,
        address: '0x0000000000000000000000000000000000000000',
        assetId: 'eip155:1/slip44:60',
        balance: '0',
        chainId: 'eip155:1',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        name: 'Ether',
        symbol: 'ETH',
        tokenFiatAmount: undefined,
      });
    });

    it('returns defaultToken if fromToken is undefined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { fromToken: undefined },
      });
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({
        accountType: undefined,
        address: '0x0000000000000000000000000000000000000000',
        assetId: 'eip155:1/slip44:60',
        balance: '0',
        chainId: 'eip155:1',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        name: 'Ether',
        symbol: 'ETH',
        tokenFiatAmount: undefined,
      });
    });
  });

  describe('getToToken', () => {
    it('returns selected toToken', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: { address: '0x123', symbol: 'TEST' },
          toChainId: formatChainIdToCaip(1),
          toToken: { address: '0x567', symbol: 'DEST' },
        },
        featureFlagOverrides: {
          bridgeConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: true },
            },
          },
        },
      });
      const result = getToToken(state as never);

      expect(result).toStrictEqual({ address: '0x567', symbol: 'DEST' });
    });

    it('returns default token if toToken is not set', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: { address: '0x123', symbol: 'TEST' },
          toChainId: formatChainIdToCaip(1),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: true },
            },
          },
        },
      });
      const result = getToToken(state as never);

      expect(result).toStrictEqual({
        accountType: undefined,
        address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
        assetId: 'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
        balance: '0',
        chainId: 'eip155:1',
        decimals: 6,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xacA92E438df0B2401fF60dA7E4337B687a2435DA.png',
        name: 'MetaMask USD',
        symbol: 'mUSD',
        tokenFiatAmount: undefined,
      });
    });

    it('returns null if fromToken is null', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          fromToken: null,
          toChainId: formatChainIdToCaip(1),
          toToken: { address: '0x123', symbol: 'TEST' },
        },
      });
      const result = getToToken(state as never);

      expect(result).toStrictEqual(null);
    });

    it('returns null if fromChain is not defined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: { address: '0x123', symbol: 'TEST' },
          toToken: { address: '0x456', symbol: 'DEST' },
        },
        featureFlagOverrides: {
          bridgeConfig: {
            support: true,
            chains: {
              '0x1': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
      });
      const result = getToToken(state as never);

      expect(result).toStrictEqual(null);
    });

    it('returns ETH as default token when bridging from Bitcoin', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: {
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // Bitcoin native address
            symbol: 'BTC',
            chainId: MultichainNetworks.BITCOIN,
            decimals: 8,
          },
          toChainId: formatChainIdToCaip(CHAIN_IDS.MAINNET),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            support: true,
            chains: {
              [toEvmCaipChainId(CHAIN_IDS.MAINNET)]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
            bip44DefaultPairs: {
              bip122: {
                standard: {
                  'bip122:000000000019d6689c085ae165831e93/slip44:0':
                    'eip155:1/slip44:60',
                },
                other: {},
              },
            },
          },
        },
      });
      const result = getToToken(state as never);

      // Should return ETH (native token) instead of mUSD for Bitcoin bridges
      expect(result).toStrictEqual({
        address: zeroAddress(),
        assetId: 'eip155:1/slip44:60',
        balance: '0',
        chainId: 'eip155:1',
        decimals: 18,
        iconUrl: '',
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        name: 'Ether',
        symbol: 'ETH',
        tokenFiatAmount: undefined,
        accountType: undefined,
      });
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

  describe('getBridgeQuotes', () => {
    it('returns quote list and fetch data, insufficientBal=false,quotesRefreshCount=5', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            maxRefreshCount: 5,
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
          fromTokenExchangeRate: 1,
          fromToken: { address: zeroAddress(), symbol: 'TEST' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
        },
        bridgeStateOverrides: {
          quoteRequest: {
            insufficientBal: false,
            srcChainId: 10,
            srcTokenAddress: zeroAddress(),
            destChainId: '0x89',
            destTokenAddress: zeroAddress(),
          },
          quotes: mockErc20Erc20Quotes as unknown as QuoteResponse[],
          quotesRefreshCount: 5,
          quotesLastFetched: 100,
          quotesInitialLoadTime: 11000,
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 1,
              usdConversionRate: 1,
            },
            POL: {
              conversionRate: 0.99,
              usdConversionRate: 0.99,
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
      expect(result.sortedQuotes).toHaveLength(2);
      const { recommendedQuote, activeQuote, ...rest } = result;
      expect(recommendedQuote).toStrictEqual(activeQuote);
      const {
        quote,
        approval,
        trade,
        estimatedProcessingTimeInSeconds,
        ...calculatedQuoteMetadata
      } = recommendedQuote as QuoteMetadata & QuoteResponse;
      expect(calculatedQuoteMetadata).toMatchSnapshot();
      expect({
        quote,
        approval,
        trade,
        estimatedProcessingTimeInSeconds,
      }).toStrictEqual(mockErc20Erc20Quotes[0]);
      expect(rest).toStrictEqual({
        sortedQuotes: expect.any(Array),
        quotesLastFetchedMs: 100,
        isLoading: false,
        quotesRefreshCount: 5,
        quotesInitialLoadTimeMs: 11000,
        isQuoteGoingToRefresh: false,
        quoteFetchError: null,
      });
    });

    it('returns quote list and fetch data, insufficientBal=false,quotesRefreshCount=2', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            maxRefreshCount: 5,
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 1,
        },
        bridgeStateOverrides: {
          quoteRequest: {
            insufficientBal: false,
            srcChainId: 10,
            srcTokenAddress: zeroAddress(),
            destChainId: '0x89',
            destTokenAddress: zeroAddress(),
          },
          quotes: mockErc20Erc20Quotes as unknown as QuoteResponse[],
          quotesRefreshCount: 2,
          quotesInitialLoadTime: 11000,
          quotesLastFetched: 100,
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 1,
              usdConversionRate: 20,
            },
            POL: {
              conversionRate: 0.9899999999999999,
              usdConversionRate: 0.99 / 0.354073,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      });
      const result = getBridgeQuotes(state as never);

      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        {
          usd: '240.919484728424019402436',
          valueInCurrency: '0.156562864428420918428',
        },
        {
          usd: '241.43473800386724486',
          valueInCurrency: '0.33900007473646602',
        },
      ];
      result.sortedQuotes.forEach(
        (quote: QuoteMetadata & QuoteResponse, idx: number) => {
          expect(quote.cost).toStrictEqual(EXPECTED_SORTED_COSTS[idx]);
        },
      );

      const { recommendedQuote, activeQuote, ...rest } = result;
      expect(recommendedQuote).toStrictEqual(activeQuote);
      const {
        quote,
        approval,
        trade,
        estimatedProcessingTimeInSeconds,
        ...calculatedQuoteMetadata
      } = recommendedQuote as QuoteMetadata & QuoteResponse;
      expect(calculatedQuoteMetadata).toMatchSnapshot();
      expect({
        quote,
        approval,
        trade,
        estimatedProcessingTimeInSeconds,
      }).toStrictEqual(mockErc20Erc20Quotes[0]);
      expect(rest).toStrictEqual({
        sortedQuotes: expect.any(Array),
        quotesLastFetchedMs: 100,
        isLoading: false,
        quotesRefreshCount: 2,
        isQuoteGoingToRefresh: true,
        quotesInitialLoadTimeMs: 11000,
        quoteFetchError: null,
      });
    });

    it('returns quote list and fetch data, insufficientBal=true', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            maxRefreshCount: 5,
            chains: {
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 1,
        },
        bridgeStateOverrides: {
          quoteRequest: {
            insufficientBal: true,
            srcChainId: 10,
            srcTokenAddress: zeroAddress(),
            destChainId: '0x89',
            destTokenAddress: zeroAddress(),
          },
          quotes: mockErc20Erc20Quotes as unknown as QuoteResponse[],
          quotesRefreshCount: 1,
          quotesLastFetched: 100,
          quotesInitialLoadTime: 11000,
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 1,
              usdConversionRate: 20,
            },
            POL: {
              conversionRate: 0.99,
              usdConversionRate: 0.99,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      });
      const result = getBridgeQuotes(state as never);

      expect(result.sortedQuotes).toHaveLength(2);

      const EXPECTED_SORTED_COSTS = [
        {
          usd: '266.1755640885683904',
          valueInCurrency: '0.15656286442841952',
        },
        {
          usd: '266.3580014947292928',
          valueInCurrency: '0.33900007473646464',
        },
      ];
      result.sortedQuotes.forEach(
        (quote: QuoteMetadata & QuoteResponse, idx: number) => {
          expect(quote.cost).toStrictEqual(EXPECTED_SORTED_COSTS[idx]);
        },
      );

      const { recommendedQuote, activeQuote, ...rest } = result;
      expect(recommendedQuote).toStrictEqual(activeQuote);
      const {
        quote,
        approval,
        trade,
        estimatedProcessingTimeInSeconds,
        ...calculatedQuoteMetadata
      } = recommendedQuote as QuoteMetadata & QuoteResponse;
      expect({
        quote,
        approval,
        trade,
        estimatedProcessingTimeInSeconds,
      }).toStrictEqual(mockErc20Erc20Quotes[0]);
      expect(calculatedQuoteMetadata).toMatchSnapshot();
      expect(rest).toStrictEqual({
        sortedQuotes: expect.any(Array),
        quotesLastFetchedMs: 100,
        quotesInitialLoadTimeMs: 11000,
        isLoading: false,
        quotesRefreshCount: 1,
        isQuoteGoingToRefresh: false,
        quoteFetchError: null,
      });
    });
  });

  describe('getBridgeQuotes', () => {
    it('should return empty values when quotes are not present', () => {
      const state = createBridgeMockStore({
        bridgeStateOverrides: { quotes: [] },
      });

      const result = getBridgeQuotes(state as never);

      expect(result).toStrictEqual({
        activeQuote: null,
        isLoading: false,
        isQuoteGoingToRefresh: true,
        quotesLastFetchedMs: null,
        quotesRefreshCount: 0,
        recommendedQuote: null,
        quotesInitialLoadTimeMs: null,
        sortedQuotes: [],
        quoteFetchError: null,
      });
    });

    it('should sort quotes by adjustedReturn', () => {
      const state = createBridgeMockStore({
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        },
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
            ...(mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[]),
            {
              ...mockBridgeQuotesNativeErc20[0],
              estimatedProcessingTimeInSeconds: 1,
              quote: {
                ...(mockBridgeQuotesNativeErc20[0]
                  .quote as unknown as QuoteResponse['quote']),
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
    it('should return isNoQuotesAvailable=false when quote request is invalid', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '1000',
        },
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: CHAIN_IDS.MAINNET,
            destChainId: ChainId.SOLANA,
            srcTokenAddress: zeroAddress(),
            walletAddress: '0x1234',
            destTokenAddress: zeroAddress(),
          },
          quotes: [],
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 1,
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isNoQuotesAvailable).toStrictEqual(false);
    });

    it('should return isNoQuotesAvailable=true when swapping on EVM', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '.000000000000001000',
        },
        bridgeStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1000',
            srcChainId: CHAIN_IDS.MAINNET,
            destChainId: CHAIN_IDS.MAINNET,
            srcTokenAddress: zeroAddress(),
            walletAddress: '0x1234',
            destTokenAddress: '0x1234',
          },
          quotes: [],
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 1,
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isNoQuotesAvailable).toStrictEqual(true);
    });

    it('should return isNoQuotesAvailable=false on initial load', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x1') },
        bridgeStateOverrides: {
          quotes: [],
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isNoQuotesAvailable).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=true', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromToken: {
            decimals: 6,
            address: zeroAddress(),
            chainId: CHAIN_IDS.MAINNET,
          },
          fromTokenInputValue: '1000',
          fromTokenBalance: '990',
        },
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '890880',
          quotesLastFetched: Date.now(),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientBalance).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=true when balance === minimumBalanceForRentExemption + srcTokenAmount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromToken: {
            decimals: 9,
            address: zeroAddress(),
            chainId: formatChainIdToCaip(ChainId.SOLANA),
          },
          fromTokenInputValue: '1000000000',
          fromNativeBalance: '2000000000',
        },
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '1000000000',
          quotesLastFetched: Date.now(),
          quoteRequest: {
            srcChainId: ChainId.SOLANA,
          },
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=true when balance < minimumBalanceForRentExemption + srcTokenAmount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromToken: {
            decimals: 9,
            address: zeroAddress(),
            chainId: formatChainIdToCaip(ChainId.SOLANA),
          },
          fromTokenInputValue: '1000000000',
          fromNativeBalance: null,
        },
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '1000000000',
          quotesLastFetched: Date.now(),
          quoteRequest: {
            srcTokenAmount: '1000000000',
            srcChainId: ChainId.SOLANA,
          },
        },
        metamaskStateOverrides: {
          accountTree: {
            selectedAccountGroup: 'entropy-test-account-group-id/0',
            wallets: {
              'entropy-test-account-group-id': {
                id: 'entropy-test-account-group-id',
                type: 'entropy',
              },
              groups: {
                'entropy-test-account-group-id/0': {
                  id: 'entropy-test-account-group-id/0',
                  type: 'multichain-account',
                  accounts: ['test-account-id'],
                },
              },
            },
          },
          internalAccounts: {
            selectedAccount: 'test-account-id',
            accounts: {
              'test-account-id': {
                id: 'test-account-id',
                type: SolAccountType.DataAccount,
                address: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8K',
                scopes: [SolScope.Mainnet],
              },
            },
          },
          balances: {
            'test-account-id': {
              [getNativeAssetForChainId(ChainId.SOLANA).assetId]: {
                amount: '.99',
              },
            },
          },
          selectedMultichainNetworkChainId: formatChainIdToCaip(ChainId.SOLANA),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
          },
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=false when balance > minimumBalanceForRentExemption + srcTokenAmount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromToken: { decimals: 9, address: zeroAddress() },
          fromChain: { chainId: formatChainIdToCaip(ChainId.SOLANA) },
          srcTokenInputValue: '1000000000',
        },
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '1000000000',
          quotesLastFetched: Date.now(),
          quoteRequest: {
            srcTokenAmount: '1000000000',
            srcChainId: ChainId.SOLANA,
          },
        },
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'test-account-id',
            accounts: {
              'test-account-id': {
                id: 'test-account-id',
                type: SolAccountType.DataAccount,
                address: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8K',
                scopes: [SolScope.Mainnet],
              },
            },
          },
          balances: {
            'test-account-id': {
              [getNativeAssetForChainId(ChainId.SOLANA).assetId]: {
                amount: '2.0000001',
              },
            },
          },
          selectedMultichainNetworkChainId: formatChainIdToCaip(ChainId.SOLANA),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(false);
    });

    it('should return isInsufficientGasBalance=false when minimumBalanceForRentExemption is null', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromToken: {
            decimals: 9,
            address: zeroAddress(),
            chainId: formatChainIdToCaip(ChainId.SOLANA),
          },
          srcTokenInputValue: '1000000000',
        },
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: null,
          quotesLastFetched: Date.now(),
          quoteRequest: {
            srcTokenAmount: '1000000000',
            srcChainId: ChainId.SOLANA,
          },
        },
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'test-account-id',
            accounts: {
              'test-account-id': {
                id: 'test-account-id',
                type: SolAccountType.DataAccount,
                address: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8K',
                scopes: [SolScope.Mainnet],
              },
            },
          },
          balances: {
            'test-account-id': {
              [getNativeAssetForChainId(ChainId.SOLANA).assetId]: {
                amount: '1.01',
              },
            },
          },
          selectedMultichainNetworkChainId: formatChainIdToCaip(ChainId.SOLANA),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=false when there is no input amount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenBalance: '990',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientBalance).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=false when there is no balance', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenBalance: null,
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientBalance).toStrictEqual(false);
    });

    it('should return isInsufficientBalance=false when balance is 0', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '.001000',
          fromToken: {
            decimals: 6,
            address: zeroAddress(),
            chainId: CHAIN_IDS.MAINNET,
          },
          fromTokenBalance: '0',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
          quoteRequest: { srcTokenAmount: '1000' },
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientBalance).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=true when balance is equal to srcAmount and fromToken is native', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '.010000000000000000',
          fromToken: {
            address: zeroAddress(),
            decimals: 18,
            chainId: CHAIN_IDS.MAINNET,
          },
          fromNativeBalance: '10000000000000000',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
          quoteRequest: { srcTokenAmount: '10000000000000000' },
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=true when balance is 0 and fromToken is erc20', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
          toToken: {
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            symbol: 'TEST',
          },
          fromTokenInputValue: '0.001',
          fromToken: {
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            decimals: 6,
            chainId: CHAIN_IDS.MAINNET,
          },
          fromTokenBalance: '1000000',
          fromNativeBalance: '0',
        },
        bridgeStateOverrides: {
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

      expect(result.isInsufficientGasBalance).toStrictEqual(true);
    });

    it('should return isInsufficientGasBalance=false if there is no fromAmount', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromNativeBalance: '0',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
          quoteRequest: {},
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(false);
    });

    it('should return isInsufficientGasBalance=false when quotes have been loaded', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '0.001',
          fromNativeBalance: '0',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
          quotes: mockErc20Erc20Quotes as unknown as QuoteResponse[],
        },
      });
      const result = getValidationErrors(state as never);

      expect(result.isInsufficientGasBalance).toStrictEqual(false);
    });

    it('should return isInsufficientGasForQuote=true when balance is less than required network fees in quote', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '0.001',
          fromToken: {
            address: zeroAddress(),
            decimals: 18,
            chainId: CHAIN_IDS.MAINNET,
          },
          fromNativeBalance: '1000000000000000',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee.amount,
      ).toStrictEqual('0.00100011265800784');
      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.amount,
      ).toStrictEqual('0.01');
      expect(result.isInsufficientGasForQuote).toBe(true);
    });

    it('should return isInsufficientGasForQuote=false when balance is greater than max network fees in quote', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
          fromTokenInputValue: '0.001',
          fromToken: {
            address: zeroAddress(),
            decimals: 18,
            chainId: CHAIN_IDS.MAINNET,
          },
          fromNativeBalance: '1000000000000000000',
        },
        bridgeStateOverrides: {
          quotesLastFetched: Date.now(),
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee.amount,
      ).toStrictEqual('0.00100011265800784');
      expect(
        getBridgeQuotes(state as never).activeQuote?.totalMaxNetworkFee.amount,
      ).toStrictEqual('0.00100011265800784');
      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.amount,
      ).toStrictEqual('0.01');
      expect(result.isInsufficientGasForQuote).toStrictEqual(false);
    });

    it('should return isEstimatedReturnLow=true return value is less than 65% of sent funds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
          fromToken: {
            address: zeroAddress(),
            symbol: 'ETH',
            chainId: CHAIN_IDS.MAINNET,
          },
          toToken: {
            address: zeroAddress(),
            symbol: 'TEST',
          },
          fromTokenInputValue: '1',
          fromTokenExchangeRate: 2524.25,
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
          quoteRequest: {
            srcChainId: 10,
            srcTokenAddress: zeroAddress(),
            destChainId: '0x89',
            destTokenAddress: zeroAddress(),
          },
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
            },
            POL: {
              conversionRate: 0.61,
              usdConversionRate: 1,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.valueInCurrency,
      ).toBe('25.2425');
      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee
          .valueInCurrency,
      ).toBe('2.52453437697629012');
      expect(
        getBridgeQuotes(state as never).activeQuote?.toTokenAmount
          .valueInCurrency,
      ).toBe('14.90773022');
      expect(
        getBridgeQuotes(state as never).activeQuote?.adjustedReturn
          .valueInCurrency,
      ).toBe('12.38319584302370988');
      expect(result.isEstimatedReturnLow).toBe(true);
    });

    it('should return isEstimatedReturnLow=false when return value is more than 65% of sent funds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip(10),
          fromToken: {
            address: zeroAddress(),
            symbol: 'ETH',
            chainId: 10,
            decimals: 18,
          },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 2524.25,
          fromTokenInputValue: '1',
        },
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: 10,
            srcTokenAddress: zeroAddress(),
            destChainId: '0x89',
            destTokenAddress: zeroAddress(),
          },
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        },
        metamaskStateOverrides: {
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
              usdConversionRate: 1,
            },
            POL: {
              conversionRate: 0.95,
              usdConversionRate: 0.95,
            },
          },
          marketData: {},
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      });
      const result = getValidationErrors(state as never);

      expect(
        getBridgeQuotes(state as never).activeQuote?.sentAmount.valueInCurrency,
      ).toBe('25.2425');
      expect(
        getBridgeQuotes(state as never).activeQuote?.totalNetworkFee
          .valueInCurrency,
      ).toBe('2.52453437697629012');
      expect(
        getBridgeQuotes(state as never).activeQuote?.adjustedReturn
          .valueInCurrency,
      ).toBe('20.69242252302370988');
      expect(result.isEstimatedReturnLow).toBe(false);
    });

    it('should return isEstimatedReturnLow=false if there are no quotes', () => {
      const state = createBridgeMockStore({
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

      expect(getBridgeQuotes(state as never).activeQuote).toStrictEqual(null);
      expect(result.isEstimatedReturnLow).toStrictEqual(false);
    });
  });

  describe('getFromTokenBalance', () => {
    it('should return the balance of a Solana token', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
          },
        },
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
          },
          balances: {
            'bf13d52c-d6e8-40ea-9726-07d7149a3ca5': {
              [getNativeAssetForChainId(MultichainNetworks.SOLANA).assetId]: {
                amount: '2',
              },
            },
          },
        },
      });

      const result = getFromTokenBalance(state as never);
      expect(result).toBe('2');
    });

    it('should return the balance of an EVM fromToken token', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
            chainId: toEvmCaipChainId(CHAIN_IDS.MAINNET),
          },
          fromTokenBalance: '2000000',
        },
      });
      const result = getFromTokenBalance(state as never);
      expect(result).toBe('2');
    });
  });

  describe('getFromAccount', () => {
    it('should return the selected Solana account', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
          },
        },
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
          },
          balances: {
            'bf13d52c-d6e8-40ea-9726-07d7149a3ca5': {
              [getNativeAssetForChainId(MultichainNetworks.SOLANA).assetId]: {
                amount: '2',
              },
            },
          },
        },
      });

      const result = getFromAccount(state as never);
      expect(result).toMatchObject({
        id: 'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
        type: SolAccountType.DataAccount,
        address: 'ABCDEu4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8J',
      });
    });

    it('should return the selected EVM account', () => {
      const state = createBridgeMockStore({});
      const result = getFromAccount(state as never);
      expect(result).toStrictEqual(
        expect.objectContaining({
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        }),
      );
    });

    it('should return the selected internal account if accountGroup does not have account for scope', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
          },
        },
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
          accountTree: {
            // This account group only has 1 Solana account
            selectedAccountGroup: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/2',
          },
        },
      });

      expect(getFromChain(state as never)).toStrictEqual(
        expect.objectContaining({
          chainId: '0x1',
        }),
      );
      const result = getFromAccount(state as never);
      expect(result).toMatchObject({
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        type: 'eip155:eoa',
      });
    });
  });

  describe('getIsSwap', () => {
    it('returns true when source and destination chains are the same', () => {
      const state = createBridgeMockStore({
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: '0x1',
            destChainId: '0x1',
          },
        },
      });

      const result = getIsSwap(state as never);
      expect(result).toBe(true);
    });

    it('returns false when source and destination chains are different', () => {
      const state = createBridgeMockStore({
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: '0x1',
            destChainId: '0x89',
          },
        },
      });

      const result = getIsSwap(state as never);
      expect(result).toBe(false);
    });

    it('returns false when either chain ID is missing', () => {
      const stateNoSrc = createBridgeMockStore({
        bridgeStateOverrides: {
          quoteRequest: {
            destChainId: '0x1',
          },
        },
      });
      const stateNoDest = createBridgeMockStore({
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: '0x1',
          },
        },
      });

      expect(getIsSwap(stateNoSrc as never)).toBe(false);
      expect(getIsSwap(stateNoDest as never)).toBe(false);
    });

    it('handles CAIP chain ID format', () => {
      const state = createBridgeMockStore({
        bridgeStateOverrides: {
          quoteRequest: {
            srcChainId: 'eip155:1',
            destChainId: 'eip155:1',
          },
        },
      });

      const result = getIsSwap(state as never);
      expect(result).toBe(true);
    });
  });

  describe('getFromTokenConversionRate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return default exchange rates when fromChain or fromToken is missing', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {},
          currencyRates: {},
        },
        bridgeSliceOverrides: {
          fromTokenExchangeRate: 1.0,
        },
      });

      const result = getFromTokenConversionRate(state);
      expect(result).toStrictEqual({
        valueInCurrency: null,
        usd: null,
      });
    });

    it('should handle EVM tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {
            '0x1': {
              [toChecksumHexAddress(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              )]: { price: 1.2 },
            },
          },
          currencyRates: {
            ETH: { conversionRate: 1500, usdConversionRate: 2000 },
          },
          ...mockNetworkState({ chainId: '0x1' }),
        },
        bridgeSliceOverrides: {
          fromToken: toBridgeToken({
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
            chainId: formatChainIdToCaip(ChainId.ETH),
            symbol: 'USDC',
            name: 'USD',
            assetId:
              'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          }),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              'eip155:1': { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
      });

      const result = getFromTokenConversionRate(state);
      expect(result).toStrictEqual({
        valueInCurrency: 1800,
        usd: 2400,
      });
    });

    it('should handle native EVM tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {
            '0x1': {
              [zeroAddress()]: { price: 1 },
              [toChecksumHexAddress(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              )]: { price: 1.2 },
            },
          },
          currencyRates: {
            ETH: { conversionRate: 2000, usdConversionRate: 2000 },
          },
          ...mockNetworkState({ chainId: '0x1' }),
        },
        bridgeSliceOverrides: {
          fromToken: toBridgeToken(getNativeAssetForChainId(1)),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              'eip155:1': { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
      });

      const result = getFromTokenConversionRate(state);
      expect(result).toStrictEqual({
        valueInCurrency: 2000,
        usd: 2000,
      });
    });

    it('should handle Solana tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'account-1',
            accounts: {
              'account-1': {
                address: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8K',
                type: SolAccountType.DataAccount,
                scopes: [SolScope.Mainnet],
              },
            },
          },
          marketData: {},
          currencyRates: {},
          selectedMultichainNetworkChainId: formatChainIdToCaip(ChainId.SOLANA),
          conversionRates: {
            [getNativeAssetForChainId(MultichainNetworks.SOLANA)?.assetId]: {
              rate: 1.5,
            },
            [`${formatChainIdToCaip(
              ChainId.SOLANA,
            )}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`]: {
              rate: 2.1,
            },
          },
          rates: {
            sol: {
              conversionRate: 1.99,
              usdConversionRate: 1.4,
            },
          },
        },
        bridgeSliceOverrides: {
          fromTokenExchangeRate: 2.0,
          fromToken: toBridgeToken({
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            chainId: MultichainNetworks.SOLANA,
            symbol: 'USDC',
            name: 'USD',
          }),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: false,
              },
            },
          },
        },
      });

      const result = getFromTokenConversionRate(state);
      expect(result).toStrictEqual({
        usd: 1.4070351758793969,
        valueInCurrency: 2,
      });
    });

    it('should handle Solana native tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: 'account-1',
            accounts: {
              'account-1': {
                address: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8K',
                type: SolAccountType.DataAccount,
                scopes: [SolScope.Mainnet],
              },
            },
          },
          marketData: {},
          currencyRates: {},
          ...mockNetworkState({ chainId: '0x1' }),
          conversionRates: {
            [getNativeAssetForChainId(MultichainNetworks.SOLANA)?.assetId]: {
              rate: 1.54,
            },
          },
          rates: {
            sol: {
              usdConversionRate: 1.4,
              conversionRate: 1.55,
            },
          },
        },
        bridgeSliceOverrides: {
          fromTokenExchangeRate: 1.5,
          fromToken: toBridgeToken(getNativeAssetForChainId(ChainId.SOLANA)),
        },
        featureFlagOverrides: {
          bridgeConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: false,
              },
            },
          },
        },
      });

      const result = getFromTokenConversionRate(state);
      expect(result).toStrictEqual({
        usd: 1.354838709677419,
        valueInCurrency: 1.5,
      });
    });
  });

  describe('getIsGasIncluded', () => {
    it('returns true when both smart transactions are enabled and chain supports gas-included swaps', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({
            id: 'network-configuration-id-1',
            chainId: CHAIN_IDS.MAINNET,
            rpcUrl: 'https://mainnet.infura.io/v3/',
          }),
          accounts: {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              balance: '0x15f6f0b9d4f8d000',
            },
          },
          preferences: {
            smartTransactionsOptInStatus: true,
          },
          smartTransactionsState: {
            liveness: true,
          },
          swapsState: {
            swapsFeatureFlags: {
              ethereum: {
                extensionActive: true,
                mobileActive: true,
                smartTransactions: {
                  expectedDeadline: 45,
                  maxDeadline: 150,
                  returnTxHashAsap: false,
                  extensionActive: true,
                },
              },
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                returnTxHashAsap: false,
                extensionActive: true,
              },
            },
          },
        },
      });

      const result = getIsGasIncluded(state as never, true);
      expect(result).toBe(true);
    });

    it('returns false when smart transactions are enabled but chain does not support gas-included swaps', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          preferences: {
            smartTransactionsOptInStatus: true,
          },
          smartTransactionsState: {
            liveness: true,
          },
          swapsState: {
            swapsFeatureFlags: {
              ethereum: {
                extensionActive: true,
                mobileActive: true,
                smartTransactions: {
                  expectedDeadline: 45,
                  maxDeadline: 150,
                  returnTxHashAsap: false,
                  extensionActive: true,
                },
              },
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                returnTxHashAsap: false,
              },
            },
          },
        },
      });

      const result = getIsGasIncluded(state as never, false);
      expect(result).toBe(false);
    });

    it('returns false when smart transactions are disabled but chain supports gas-included swaps', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          preferences: {
            smartTransactionsOptInStatus: false,
          },
        },
      });

      const result = getIsGasIncluded(state as never, true);
      expect(result).toBe(false);
    });

    it('returns false when both smart transactions are disabled and chain does not support gas-included swaps', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          preferences: {
            smartTransactionsOptInStatus: false,
          },
        },
      });

      const result = getIsGasIncluded(state as never, false);
      expect(result).toBe(false);
    });
  });
});
