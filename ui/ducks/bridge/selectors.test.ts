import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import {
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { mockNetworkState } from '../../../test/stub/networks';
import mockErc20Erc20Quotes from '../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../test/data/bridge/mock-quotes-native-erc20.json';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  getAllBridgeableNetworks,
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getIsBridgeTx,
  getIsSwap,
  getToChain,
  getToChains,
  getToToken,
  getValidationErrors,
  getFromTokenConversionRate,
  getToTokenConversionRate,
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0xe708') },
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

      expect(result).toHaveLength(9);
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

      expect(result).toHaveLength(3);
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
          extensionConfig: {
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x38') },
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x1') },
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x38') },
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
              [CHAIN_IDS.LINEA_MAINNET]: {
                isActiveSrc: false,
                isActiveDest: true,
              },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
        },
        metamaskStateOverrides: {
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
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
        assetId: 'eip155:1/slip44:60',
        chainId: 'eip155:1',
        decimals: 18,
        image: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
        string: '0',
        balance: '0',
      });
    });

    it('returns defaultToken if fromToken is undefined', () => {
      const state = createBridgeMockStore({
        bridgeSliceOverrides: { fromToken: undefined },
      });
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        assetId: 'eip155:1/slip44:60',
        chainId: 'eip155:1',
        decimals: 18,
        image: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
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
          toChainId: formatChainIdToCaip('0x89'),
          fromTokenExchangeRate: 1,
          fromToken: { address: zeroAddress(), symbol: 'TEST' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          toTokenExchangeRate: 0.99,
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

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          valueInCurrency: expect.any(Object),
          usd: expect.any(Object),
        },
        cost: {
          valueInCurrency: new BigNumber('0.15656287141025952'),
          usd: new BigNumber('0.15656287141025952'),
        },
        sentAmount: {
          valueInCurrency: new BigNumber('14'),
          amount: new BigNumber('14'),
          usd: new BigNumber('14'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          valueInCurrency: new BigNumber('13.8444372'),
          usd: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          amountMax: new BigNumber('9.933761952e-8'),
          usd: new BigNumber('7.141025952e-8'),
          usdMax: new BigNumber('9.933761952e-8'),
          valueInCurrency: new BigNumber('7.141025952e-8'),
          valueInCurrencyMax: new BigNumber('9.933761952e-8'),
        },
        totalMaxNetworkFee: {
          amount: new BigNumber('0.00100009933761952'),
          valueInCurrency: new BigNumber('0.00100009933761952'),
          usd: new BigNumber('0.00100009933761952'),
        },
        totalNetworkFee: {
          valueInCurrency: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
          usd: new BigNumber('0.00100007141025952'),
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
        quoteFetchError: null,
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
          toChainId: formatChainIdToCaip('0x89'),
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 1,
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
              usdConversionRate: 20,
            },
            POL: {
              conversionRate: 0.9899999999999999,
              usdConversionRate: 0.99 / 0.354073,
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
          usd: new BigNumber('39.080515131939180597564'),
        },
        cost: {
          valueInCurrency: new BigNumber('0.156562871410260918428'),
          usd: new BigNumber('240.919484868060819402436'),
        },
        sentAmount: {
          valueInCurrency: new BigNumber('14'),
          amount: new BigNumber('14'),
          usd: new BigNumber('280'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          valueInCurrency: new BigNumber('13.844437199999998601572'),
          amount: new BigNumber('13.98428'),
          usd: new BigNumber('39.100516560144370997564'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          amountMax: new BigNumber('9.933761952e-8'),
          valueInCurrency: new BigNumber('7.141025952e-8'),
          valueInCurrencyMax: new BigNumber('9.933761952e-8'),
          usd: new BigNumber('0.0000014282051904'),
          usdMax: new BigNumber('0.0000019867523904'),
        },
        totalNetworkFee: {
          valueInCurrency: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
          usd: new BigNumber('0.0200014282051904'),
        },
        totalMaxNetworkFee: {
          valueInCurrency: new BigNumber('0.00100009933761952'),
          amount: new BigNumber('0.00100009933761952'),
          usd: new BigNumber('0.0200019867523904'),
        },
      };
      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        {
          valueInCurrency: new BigNumber('0.156562871410260918428'),
          usd: new BigNumber('240.919484868060819402436'),
        },
        {
          valueInCurrency: new BigNumber('0.33900008283534602'),
          usd: new BigNumber('241.43473816584484486'),
        },
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
        quoteFetchError: null,
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
          toChainId: formatChainIdToCaip('0x89'),
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
              usdConversionRate: 20,
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

      const recommendedQuoteMetadata = {
        adjustedReturn: {
          valueInCurrency: new BigNumber('13.84343712858974048'),
          usd: new BigNumber('13.8244357717948096'),
        },
        cost: {
          valueInCurrency: new BigNumber('0.15656287141025952'),
          usd: new BigNumber('266.1755642282051904'),
        },
        sentAmount: {
          valueInCurrency: new BigNumber('14'),
          amount: new BigNumber('14'),
          usd: new BigNumber('280'),
        },
        swapRate: new BigNumber('0.998877142857142857142857142857142857'),
        toTokenAmount: {
          valueInCurrency: new BigNumber('13.8444372'),
          amount: new BigNumber('13.98428'),
          usd: new BigNumber('13.8444372'),
        },
        gasFee: {
          amount: new BigNumber('7.141025952e-8'),
          amountMax: new BigNumber('9.933761952e-8'),
          valueInCurrency: new BigNumber('7.141025952e-8'),
          valueInCurrencyMax: new BigNumber('9.933761952e-8'),
          usd: new BigNumber('0.0000014282051904'),
          usdMax: new BigNumber('0.0000019867523904'),
        },
        totalNetworkFee: {
          valueInCurrency: new BigNumber('0.00100007141025952'),
          amount: new BigNumber('0.00100007141025952'),
          usd: new BigNumber('0.0200014282051904'),
        },
        totalMaxNetworkFee: {
          valueInCurrency: new BigNumber('0.00100009933761952'),
          amount: new BigNumber('0.00100009933761952'),
          usd: new BigNumber('0.0200019867523904'),
        },
      };
      expect(result.sortedQuotes).toHaveLength(2);
      const EXPECTED_SORTED_COSTS = [
        {
          valueInCurrency: new BigNumber('0.15656287141025952'),
          usd: new BigNumber('266.1755642282051904'),
        },
        {
          valueInCurrency: new BigNumber('0.33900008283534464'),
          usd: new BigNumber('266.3580016567068928'),
        },
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
        quoteFetchError: null,
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
        quotesLastFetchedMs: null,
        quotesRefreshCount: 0,
        recommendedQuote: undefined,
        quotesInitialLoadTimeMs: null,
        sortedQuotes: [],
        quoteFetchError: null,
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x1') },
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x1') },
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
          toChainId: formatChainIdToCaip('0x1'),
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x1') },
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
        bridgeSliceOverrides: { toChainId: formatChainIdToCaip('0x1') },
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
          toChainId: formatChainIdToCaip('0x1'),
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
          toChainId: formatChainIdToCaip('0x1'),
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
          toChainId: formatChainIdToCaip('0x89'),
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
          toChainId: formatChainIdToCaip('0x1'),
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
          toChainId: formatChainIdToCaip('0x1'),
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
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x1'),
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
          toChainId: formatChainIdToCaip('0x1'),
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

    it('should return isEstimatedReturnLow=true return value is less than 65% of sent funds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
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
              conversionRate: 0.61,
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

    it('should return isEstimatedReturnLow=false when return value is more than 65% of sent funds', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              '0x1': { isActiveSrc: true, isActiveDest: false },
              '0xa': { isActiveSrc: true, isActiveDest: false },
              '0x89': { isActiveSrc: false, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: formatChainIdToCaip('0x89'),
          fromToken: { address: zeroAddress(), symbol: 'ETH' },
          toToken: { address: zeroAddress(), symbol: 'TEST' },
          fromTokenExchangeRate: 2524.25,
          toTokenExchangeRate: 0.95,
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
              conversionRate: 0.95,
              usdConversionRate: 0.95,
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
      ).toStrictEqual(new BigNumber('20.69239170627291988'));
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
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { price: 1.2 },
            },
          },
          currencyRates: {
            ETH: { conversionRate: 1500, usdConversionRate: 2000 },
          },
          ...mockNetworkState({ chainId: '0x1' }),
        },
        bridgeSliceOverrides: {
          fromToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
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
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { price: 1.2 },
            },
          },
          currencyRates: {
            ETH: { conversionRate: 2000, usdConversionRate: 2000 },
          },
          ...mockNetworkState({ chainId: '0x1' }),
        },
        bridgeSliceOverrides: {
          fromToken: {
            address: zeroAddress(),
            decimals: 18,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
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
                type: 'solana:data-account',
              },
            },
          },
          marketData: {},
          currencyRates: {},
          ...mockNetworkState({ chainId: '0x1' }),
          conversionRates: {
            [getNativeAssetForChainId(MultichainNetworks.SOLANA)?.assetId]: {
              rate: 1.5,
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
              {
                rate: 2.0,
              },
          },
          rates: {
            sol: {
              conversionRate: 1.5,
              usdConversionRate: 1.4,
            },
          },
        },
        bridgeSliceOverrides: {
          fromTokenExchangeRate: 1.0,
          fromToken: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
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
        usd: 1.8666666666666665,
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
                type: 'solana:data-account',
              },
            },
          },
          marketData: {},
          currencyRates: {},
          ...mockNetworkState({ chainId: '0x1' }),
          conversionRates: {
            [getNativeAssetForChainId(MultichainNetworks.SOLANA)?.assetId]: {
              rate: 1.5,
            },
          },
          rates: {
            sol: {
              usdConversionRate: 1.4,
            },
          },
        },
        bridgeSliceOverrides: {
          fromTokenExchangeRate: 1.0,
          fromToken: {
            address: zeroAddress(),
            decimals: 18,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
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
        usd: 1.4,
        valueInCurrency: 1.5,
      });
    });
  });

  describe('getToTokenConversionRate', () => {
    it('should return default exchange rates when toChain or toToken is missing', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {},
        },
        bridgeSliceOverrides: {
          toTokenExchangeRate: 1.0,
          toTokenUsdExchangeRate: 2.0,
        },
      });

      const result = getToTokenConversionRate(state);
      expect(result).toStrictEqual({
        valueInCurrency: null,
        usd: null,
      });
    });

    it('should use bridge state rates when toChain is not imported', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {},
        },
        bridgeSliceOverrides: {
          toTokenExchangeRate: 1.5,
          toTokenUsdExchangeRate: 2.5,
          toChainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM),
          toToken: { address: '0x123', decimals: 18 },
        },
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [formatChainIdToCaip(CHAIN_IDS.OPTIMISM)]: {
                isActiveSrc: false,
                isActiveDest: true,
              },
            },
          },
        },
      });

      const result = getToTokenConversionRate(state);
      expect(result).toStrictEqual({
        valueInCurrency: 1.5,
        usd: 2.5,
      });
    });

    it('should handle EVM tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {
            '0xa': {
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { price: 1.2 },
            },
          },
          ...mockNetworkState({ chainId: '0xa' }),
          currencyRates: {
            ETH: { conversionRate: 2000, usdConversionRate: 1000 },
          },
        },
        bridgeSliceOverrides: {
          toTokenExchangeRate: 1.0,
          toTokenUsdExchangeRate: 2.0,
          toChainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM),
          toToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 18,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [formatChainIdToCaip(CHAIN_IDS.OPTIMISM)]: {
                isActiveSrc: false,
                isActiveDest: true,
              },
            },
          },
        },
      });

      const result = getToTokenConversionRate(state);
      expect(result).toStrictEqual({
        usd: 1200,
        valueInCurrency: 2400,
      });
    });

    it('should handle native EVM tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {
            '0xa': {
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { price: 1.2 },
            },
          },
          ...mockNetworkState({ chainId: '0xa' }),
          currencyRates: {
            ETH: { conversionRate: 2000, usdConversionRate: 1000 },
          },
        },
        bridgeSliceOverrides: {
          toTokenExchangeRate: 1.0,
          toTokenUsdExchangeRate: 2.0,
          toChainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM),
          toToken: {
            address: zeroAddress(),
            decimals: 6,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [formatChainIdToCaip(CHAIN_IDS.OPTIMISM)]: {
                isActiveSrc: false,
                isActiveDest: true,
              },
            },
          },
        },
      });

      const result = getToTokenConversionRate(state);
      expect(result).toStrictEqual({
        usd: 1000,
        valueInCurrency: 2000,
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
                type: 'solana:data-account',
              },
            },
          },
          marketData: {},
          currencyRates: {},
          ...mockNetworkState({ chainId: '0x1' }),
          conversionRates: {
            [getNativeAssetForChainId(MultichainNetworks.SOLANA)?.assetId]: {
              rate: 1.5,
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
              {
                rate: 2.0,
              },
          },
          rates: {
            sol: {
              conversionRate: 1.5,
              usdConversionRate: 1.4,
            },
          },
        },
        bridgeSliceOverrides: {
          toChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          toToken: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
          },
        },
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                isActiveSrc: false,
                isActiveDest: true,
              },
            },
          },
        },
      });

      const result = getToTokenConversionRate(state);

      expect(result).toStrictEqual({
        usd: 1.8666666666666665,
        valueInCurrency: 2,
      });
    });

    it('should handle Solana native tokens correctly', () => {
      const state = createBridgeMockStore({
        metamaskStateOverrides: {
          marketData: {},
          currencyRates: {},
          ...mockNetworkState({ chainId: '0x1' }),
          conversionRates: {
            [getNativeAssetForChainId(MultichainNetworks.SOLANA)?.assetId]: {
              rate: 1.5,
            },
          },
          rates: {
            sol: {
              usdConversionRate: 1.4,
            },
          },
        },
        bridgeSliceOverrides: {
          toTokenExchangeRate: 1.1,
          toTokenUsdExchangeRate: 1.2,
          toToken: {
            address: zeroAddress(),
            decimals: 18,
          },
          toChainId: MultichainNetworks.SOLANA,
        },
        featureFlagOverrides: {
          extensionConfig: {
            chains: {
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
          },
        },
      });

      const result = getToTokenConversionRate(state);
      expect(result).toStrictEqual({
        usd: 1.2,
        valueInCurrency: 1.1,
      });
    });
  });
});
