/* eslint-disable @typescript-eslint/naming-convention */
import { MockedEndpoint, Mockttp } from 'mockttp';
import {
  STELLAR_BRIDGE_CHAIN_ID,
  STELLAR_CHAIN_ID,
  STELLAR_EURC_ASSET_ID,
  STELLAR_EURC_ISSUER,
  STELLAR_NATIVE_ASSET_ID,
  STELLAR_USDC_ASSET_ID,
  STELLAR_USDC_ISSUER,
} from './common-stellar';

const BRIDGE_GET_QUOTE_RE =
  /^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getQuote(?!Stream)/u;

const HORIZON_FEE_STATS_RE =
  /(?:^https:\/\/(?:horizon\.stellar\.org|stellar-(?:mainnet|testnet)\.infura\.io\/v3\/[^/?#]+\/horizon)|(?:^|\/)horizon)\/fee_stats\/?(?:[?#].*)?$/iu;

export type StellarSwapSymbol = 'XLM' | 'USDC' | 'EURC';

type StellarQuoteFixture = {
  src: StellarSwapSymbol;
  dest: StellarSwapSymbol;
  /** Raw integer amount in asset decimals (XLM/USDC/EURC use 7). */
  srcAmount: string;
  destAmount: string;
  /** Inclusion fee in stroops (1 XLM = 1e7 stroops). */
  feeStroops?: string;
};

const STELLAR_SWAP_TOKEN_REGISTRY: Record<
  StellarSwapSymbol,
  {
    address: string;
    assetId: string;
    decimals: number;
    name: string;
    iconUrl: string;
  }
> = {
  XLM: {
    address: '0x0000000000000000000000000000000000000000',
    assetId: STELLAR_NATIVE_ASSET_ID,
    decimals: 7,
    name: 'Stellar Lumens',
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/stellar/pubnet/slip44/148.png',
  },
  USDC: {
    address: `USDC-${STELLAR_USDC_ISSUER}`,
    assetId: STELLAR_USDC_ASSET_ID,
    decimals: 7,
    name: 'USDC',
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/stellar/pubnet/asset/USDC.png',
  },
  EURC: {
    address: `EURC-${STELLAR_EURC_ISSUER}`,
    assetId: STELLAR_EURC_ASSET_ID,
    decimals: 7,
    name: 'EURC',
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/stellar/pubnet/asset/EURC.png',
  },
};

function buildStellarAsset(symbol: StellarSwapSymbol) {
  const meta = STELLAR_SWAP_TOKEN_REGISTRY[symbol];
  return {
    address: meta.address,
    chainId: STELLAR_BRIDGE_CHAIN_ID,
    assetId: meta.assetId,
    symbol,
    decimals: meta.decimals,
    name: meta.name,
    aggregators: symbol === 'XLM' ? [] : ['coinGecko'],
    occurrences: symbol === 'XLM' ? 100 : 1,
    iconUrl: meta.iconUrl,
    metadata: {},
  };
}

/**
 * Valid classic-swap envelope XDR (single pathPaymentStrictSend) for the
 * default Stellar E2E account. Built with `@stellar/stellar-sdk`
 * TimeoutInfinite so it stays usable in CI without regenerating.
 *
 * Source/dest: GDEM2…YE6K, 1 XLM → USDC (GA5Z…KZVN) destMin 0.295.
 */
export const MOCK_STELLAR_TRADE_XDR_BASE64 =
  'AAAAAgAAAADIzUW8gt8pPNJ8lSJDd7lMzl+Bifl+Ec8ATguGtfOh7AAAAGQAAAAAAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAADQAAAAAAAAAAAJiWgAAAAADIzUW8gt8pPNJ8lSJDd7lMzl+Bifl+Ec8ATguGtfOh7AAAAAFVU0RDAAAAADuZETgO/piLoKiQDrHP5E82b32+lGvtB3JA9/Yk3xXFAAAAAAAtA3AAAAAAAAAAAAAAAAA=';

function buildStellarQuoteResponse(fixture: StellarQuoteFixture) {
  const srcAsset = buildStellarAsset(fixture.src);
  const destAsset = buildStellarAsset(fixture.dest);
  const feeStroops = fixture.feeStroops ?? '8750';
  const minDestTokenAmount = String(
    BigInt(fixture.destAmount) - BigInt(fixture.destAmount) / 50n,
  );
  const grossSrcAmount = String(BigInt(fixture.srcAmount) + BigInt(feeStroops));
  const xlmAsset = buildStellarAsset('XLM');

  return {
    quote: {
      bridgeId: 'rango',
      requestId: 'stellar-swap-quote-request-id',
      aggregator: 'rango',
      srcChainId: STELLAR_BRIDGE_CHAIN_ID,
      srcTokenAmount: fixture.srcAmount,
      srcAsset,
      destChainId: STELLAR_BRIDGE_CHAIN_ID,
      destTokenAmount: fixture.destAmount,
      destAsset,
      minDestTokenAmount,
      feeData: {
        metabridge: {
          amount: feeStroops,
          asset: xlmAsset,
          quoteBpsFee: 87.5,
          baseBpsFee: 87.5,
        },
      },
      bridges: ['stellar dex (via Rango)'],
      protocols: ['stellar dex (via Rango)'],
      steps: [
        {
          srcAsset,
          destAsset,
          action: 'bridge',
          srcChainId: STELLAR_BRIDGE_CHAIN_ID,
          destChainId: STELLAR_BRIDGE_CHAIN_ID,
          protocol: {
            name: 'Stellar DEX',
            displayName: 'stellar-dex',
            icon: 'https://static.cx.metamask.io/api/v2/tokenIcons/assets/stellar/pubnet/slip44/148.png',
          },
          srcAmount: grossSrcAmount,
          destAmount: fixture.destAmount,
          minDestTokenAmount,
        },
      ],
      priceData: {
        totalFromAmountUsd: '0.4',
        totalToAmountUsd: '0.295',
        priceImpact: '-0.01',
        totalFeeAmountUsd: '0.00035',
      },
      slippage: 2,
    },
    trade: { xdrBase64: MOCK_STELLAR_TRADE_XDR_BASE64 },
    estimatedProcessingTimeInSeconds: 0,
  };
}

const MOCK_STELLAR_SWAP_TOKENS = [
  {
    address: STELLAR_SWAP_TOKEN_REGISTRY.XLM.address,
    chainId: STELLAR_CHAIN_ID,
    assetId: STELLAR_NATIVE_ASSET_ID,
    symbol: 'XLM',
    decimals: 7,
    name: 'Stellar Lumens',
    aggregators: [],
    occurrences: 100,
    iconUrl: STELLAR_SWAP_TOKEN_REGISTRY.XLM.iconUrl,
    metadata: {},
  },
  {
    address: STELLAR_SWAP_TOKEN_REGISTRY.USDC.address,
    chainId: STELLAR_CHAIN_ID,
    assetId: STELLAR_USDC_ASSET_ID,
    symbol: 'USDC',
    decimals: 7,
    name: 'USDC',
    aggregators: ['coinGecko'],
    occurrences: 1,
    iconUrl: STELLAR_SWAP_TOKEN_REGISTRY.USDC.iconUrl,
    metadata: {},
  },
  {
    address: STELLAR_SWAP_TOKEN_REGISTRY.EURC.address,
    chainId: STELLAR_CHAIN_ID,
    assetId: STELLAR_EURC_ASSET_ID,
    symbol: 'EURC',
    decimals: 7,
    name: 'EURC',
    aggregators: ['coinGecko'],
    occurrences: 1,
    iconUrl: STELLAR_SWAP_TOKEN_REGISTRY.EURC.iconUrl,
    metadata: {},
  },
];

/**
 * Mocks bridge token search/popular lists for Stellar Swap.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockBridgeGetStellarTokens(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const searchEndpoint = await mockServer
    .forPost(/getTokens\/search/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        data: MOCK_STELLAR_SWAP_TOKENS,
      },
    }));

  const popularEndpoint = await mockServer
    .forPost(/getTokens\/popular/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: MOCK_STELLAR_SWAP_TOKENS,
    }));

  return [searchEndpoint, popularEndpoint];
}

/**
 * Mocks Horizon `/fee_stats` so network-fee display succeeds during Swap.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockHorizonFeeStatsForSwap(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(HORIZON_FEE_STATS_RE)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        last_ledger: '50000000',
        last_ledger_base_fee: '100',
        ledger_capacity_usage: '0.1',
        fee_charged: {
          max: '1000',
          min: '100',
          mode: '100',
          p10: '100',
          p20: '100',
          p30: '100',
          p40: '100',
          p50: '100',
          p60: '100',
          p70: '100',
          p80: '100',
          p90: '200',
          p95: '500',
          p99: '1000',
        },
        max_fee: {
          max: '1000',
          min: '100',
          mode: '100',
          p10: '100',
          p20: '100',
          p30: '100',
          p40: '100',
          p50: '100',
          p60: '100',
          p70: '100',
          p80: '100',
          p90: '200',
          p95: '500',
          p99: '1000',
        },
      },
    }));
}

/**
 * Mocks a successful Stellar same-chain quote for the given pair.
 *
 * @param mockServer - Mockttp server.
 * @param fixture - Quote amounts / direction.
 */
export async function mockBridgeGetStellarQuoteFor(
  mockServer: Mockttp,
  fixture: StellarQuoteFixture,
): Promise<MockedEndpoint> {
  return mockServer.forGet(BRIDGE_GET_QUOTE_RE).thenCallback(() => ({
    statusCode: 200,
    json: [buildStellarQuoteResponse(fixture)],
  }));
}

/**
 * Default quote: 1 XLM → ~0.295 USDC (mirrors Tron 1 TRX → 0.295 USDT).
 *
 * @param mockServer - Mockttp server.
 */
export async function mockBridgeGetStellarQuote(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockBridgeGetStellarQuoteFor(mockServer, {
    src: 'XLM',
    dest: 'USDC',
    // 1 XLM minus 0.000875 XLM fee buffer in 7-decimal stroops.
    srcAmount: '9991250',
    destAmount: '2950000',
    feeStroops: '8750',
  });
}

/**
 * Empty quote list → no-quotes UI.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockBridgeGetStellarQuoteEmpty(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer.forGet(BRIDGE_GET_QUOTE_RE).thenCallback(() => ({
    statusCode: 200,
    json: [],
  }));
}

/**
 * Full Swap mock bundle on top of `withStellarFixtures` Horizon/token mocks.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarSwapApis(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    ...(await mockBridgeGetStellarTokens(mockServer)),
    await mockBridgeGetStellarQuote(mockServer),
    await mockHorizonFeeStatsForSwap(mockServer),
  ];
}

/**
 * Swap mocks with an empty quote response.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarSwapApisNoQuotes(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    ...(await mockBridgeGetStellarTokens(mockServer)),
    await mockBridgeGetStellarQuoteEmpty(mockServer),
  ];
}

/**
 * Swap mocks where Horizon fee_stats fails so network fees cannot be estimated.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarSwapApisWithoutFeeEstimation(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    ...(await mockBridgeGetStellarTokens(mockServer)),
    await mockBridgeGetStellarQuote(mockServer),
    await mockServer
      .forGet(HORIZON_FEE_STATS_RE)
      .always()
      .thenCallback(() => ({ statusCode: 500 })),
  ];
}
/* eslint-enable @typescript-eslint/naming-convention */
