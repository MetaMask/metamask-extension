import { Mockttp } from 'mockttp';

// Bitcoin mainnet chain ID formats
export const BTC_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93';
// Numeric chain ID used by bridge API for Bitcoin
export const BTC_CHAIN_ID_NUMERIC = 20000000000001;

// Bitcoin native asset (as returned by bridge API)
export const BTC_NATIVE_ASSET = {
  address: '0x0000000000000000000000000000000000000000',
  chainId: BTC_CHAIN_ID_NUMERIC,
  assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  symbol: 'BTC',
  decimals: 8,
  name: 'Bitcoin',
  coingeckoId: 'btc',
  aggregators: [],
  occurrences: 100,
  iconUrl:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
  metadata: {},
};

// Ethereum native asset for destination
export const ETH_NATIVE_ASSET = {
  address: '0x0000000000000000000000000000000000000000',
  chainId: 1,
  assetId: 'eip155:1/slip44:60',
  symbol: 'ETH',
  decimals: 18,
  name: 'Ether',
  coingeckoId: 'ethereum',
  aggregators: [],
  occurrences: 100,
  iconUrl:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
  metadata: {},
};

// Mock quote for BTC → ETH bridge (based on real API response)
export const MOCK_BRIDGE_QUOTE_BTC_TO_ETH = [
  {
    quote: {
      bridgeId: 'rango',
      requestId: 'c8d8be80-12a4-4f22-b09b-f313031aa481',
      aggregator: 'rango',
      srcChainId: BTC_CHAIN_ID_NUMERIC,
      srcTokenAmount: '49562500',
      srcAsset: BTC_NATIVE_ASSET,
      destChainId: 1,
      destTokenAmount: '14722609000000000000',
      destAsset: ETH_NATIVE_ASSET,
      minDestTokenAmount: '14428156819999999738',
      feeData: {
        metabridge: {
          amount: '437500',
          asset: BTC_NATIVE_ASSET,
          quoteBpsFee: 87.5,
          baseBpsFee: 87.5,
        },
      },
      bridges: ['bridgers (via Rango)'],
      protocols: ['bridgers (via Rango)'],
      steps: [
        {
          srcAsset: BTC_NATIVE_ASSET,
          destAsset: ETH_NATIVE_ASSET,
          action: 'bridge',
          srcChainId: BTC_CHAIN_ID_NUMERIC,
          destChainId: 1,
          protocol: {
            name: 'Bridgers',
            displayName: 'bridgers',
            icon: 'https://raw.githubusercontent.com/rango-exchange/assets/main/swappers/Bridgers/icon.svg',
          },
          srcAmount: '49562500',
          destAmount: '14722609000000000000',
          minDestTokenAmount: '14428156819999999738',
        },
      ],
      priceData: {
        totalFromAmountUsd: '41330.5',
        totalToAmountUsd: '40296.22251127',
        priceImpact: '0.01641821726340818',
        totalFeeAmountUsd: '361.641875',
      },
    },
    trade: {
      unsignedPsbtBase64:
        'cHNidP8BAJQCAAAAAAN9pe0CAAAAABYAFPLqwmbyhkzd5PUF2obVvXYnSrZXAAAAAAAAAAA3ajV2VWM6dG86RVRIOjB4NUNmRTczYjYwMjFFODE4Qjc3NmI0MjFCMWM0RGIyNDc0MDg2YTdlMQeeBgAAAAAAIlEgIe1bHEhrJG2TVEQhBs6qXQypErB9R/DBF7ySbork4r0AAAAAAAAAAAA=',
      inputsToSign: null,
    },
    estimatedProcessingTimeInSeconds: 600,
  },
];

// Feature flags for BTC bridge
export const BTC_BRIDGE_FEATURE_FLAGS = {
  refreshRate: 30000,
  minimumVersion: '0.0.0',
  maxRefreshCount: 5,
  support: true,
  chains: {
    '1': {
      isActiveSrc: true,
      isActiveDest: true,
    },
    [BTC_CHAIN_ID_NUMERIC.toString()]: {
      isActiveSrc: true,
      isActiveDest: false,
    },
  },
  chainRanking: [
    { chainId: 'eip155:1', name: 'Ethereum' },
    { chainId: BTC_CHAIN_ID, name: 'Bitcoin' },
  ],
};

// Mock tokens for BTC bridge
export const MOCK_BTC_TOKENS = [BTC_NATIVE_ASSET];

export const MOCK_ETH_TOKENS_FOR_BRIDGE = [
  ETH_NATIVE_ASSET,
  {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chainId: 1,
    assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    decimals: 6,
    name: 'USDC',
    coingeckoId: 'usd-coin',
    aggregators: ['coinGecko', 'lifi', 'socket'],
    occurrences: 14,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  },
];

// Mock bridge API endpoints
export async function mockBridgeFeatureFlags(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [{ bridgeConfig: BTC_BRIDGE_FEATURE_FLAGS }],
      };
    });
}

/**
 * Mock the getQuote endpoint for BTC bridge.
 * Uses .always() to respond to multiple requests (debounce, refresh, etc.)
 *
 * @param mockServer - The mock server instance
 * @param returnQuotes - Whether to return quotes or empty array (default: true)
 */
export async function mockBridgeGetQuote(
  mockServer: Mockttp,
  returnQuotes: boolean = true,
) {
  return await mockServer
    .forGet(/getQuote/u)
    .always()
    .thenCallback((req) => {
      const url = new URL(req.url);
      const srcChainId = url.searchParams.get('srcChainId');

      // Only return BTC quotes for BTC source chain
      if (srcChainId === BTC_CHAIN_ID_NUMERIC.toString()) {
        console.log(
          `[BTC Bridge Mock] getQuote called for BTC, returnQuotes: ${returnQuotes}`,
        );
        return {
          statusCode: 200,
          json: returnQuotes ? MOCK_BRIDGE_QUOTE_BTC_TO_ETH : [],
        };
      }

      // Return empty for other chains
      console.log(
        `[BTC Bridge Mock] getQuote called for non-BTC chain: ${srcChainId}`,
      );
      return {
        statusCode: 200,
        json: [],
      };
    });
}

export async function mockBridgeGetTokensBtc(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getTokens/u)
    .withQuery({ chainId: BTC_CHAIN_ID_NUMERIC.toString() })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_BTC_TOKENS,
      };
    });
}

export async function mockBridgeGetTokensEth(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getTokens/u)
    .withQuery({ chainId: '1' })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_ETH_TOKENS_FOR_BRIDGE,
      };
    });
}

export async function mockBridgePopularTokens(mockServer: Mockttp) {
  return await mockServer
    .forPost(/getTokens\/popular/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [...MOCK_BTC_TOKENS, ...MOCK_ETH_TOKENS_FOR_BRIDGE],
    }));
}

export async function mockBridgeSearchTokensBtc(mockServer: Mockttp) {
  return await mockServer
    .forPost(/getTokens\/search/u)
    .withJsonBodyIncluding({
      chainIds: [BTC_CHAIN_ID],
    })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          data: MOCK_BTC_TOKENS,
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      };
    });
}

export async function mockBridgeSearchTokensEth(mockServer: Mockttp) {
  return await mockServer
    .forPost(/getTokens\/search/u)
    .withJsonBodyIncluding({
      chainIds: ['eip155:1'],
    })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          data: MOCK_ETH_TOKENS_FOR_BRIDGE,
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      };
    });
}

export async function mockBridgeTxStatus(mockServer: Mockttp) {
  return await mockServer
    .forGet(/getTxStatus/u)
    .always()
    .thenCallback(async (req) => {
      const urlObj = new URL(req.url);
      const txHash = urlObj.searchParams.get('srcTxHash');
      const srcChainId = urlObj.searchParams.get('srcChainId');
      const destChainId = urlObj.searchParams.get('destChainId');
      return {
        statusCode: 200,
        json: {
          status: 'COMPLETE',
          isExpectedToken: true,
          bridge: 'rango',
          srcChain: {
            chainId: srcChainId,
            txHash,
          },
          destChain: {
            chainId: Number(destChainId),
            txHash:
              '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          },
        },
      };
    });
}

export async function mockTopAssetsBtc(mockServer: Mockttp) {
  return await mockServer
    .forGet(new RegExp(`${BTC_CHAIN_ID_NUMERIC}/topAssets`, 'u'))
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'BTC',
          },
        ],
      };
    });
}

export type BridgeMockOptions = {
  /** Whether to return quotes or empty array (default: true) */
  returnQuotes?: boolean;
};

/**
 * Combined mock setup for all bridge endpoints.
 *
 * @param mockServer - The mock server instance
 * @param options - Configuration options for the mocks
 */
export async function mockAllBridgeEndpoints(
  mockServer: Mockttp,
  options: BridgeMockOptions = {},
) {
  const { returnQuotes = true } = options;

  return [
    await mockBridgeFeatureFlags(mockServer),
    await mockBridgeGetQuote(mockServer, returnQuotes),
    await mockBridgeGetTokensBtc(mockServer),
    await mockBridgeGetTokensEth(mockServer),
    await mockBridgePopularTokens(mockServer),
    await mockBridgeSearchTokensBtc(mockServer),
    await mockBridgeSearchTokensEth(mockServer),
    await mockBridgeTxStatus(mockServer),
    await mockTopAssetsBtc(mockServer),
  ];
}
