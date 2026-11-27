/** E2E API mocks, one definition and one JSON fixture per endpoint. See README.md. */
import fourByteSignaturesJson from './4byte-signatures.json';
import accountsBalancesV5Json from './accounts-balances-v5.json';
import accountsSupportedNetworksV1Json from './accounts-supported-networks-v1.json';
import accountsSupportedNetworksV2Json from './accounts-supported-networks-v2.json';
import accountsTransactionsJson from './accounts-transactions.json';
import bridgeAggregatorMetadataLineaJson from './bridge-aggregator-metadata-linea.json';
import bridgeAggregatorMetadataJson from './bridge-aggregator-metadata.json';
import bridgeGetTokensPopularJson from './bridge-get-tokens-popular.json';
import bridgeGetTokensSearchJson from './bridge-get-tokens-search.json';
import bridgeGetTxStatusJson from './bridge-get-tx-status.json';
import bridgeTokensLineaJson from './bridge-tokens-linea.json';
import bridgeTokensJson from './bridge-tokens.json';
import bridgeTopAssetsLineaJson from './bridge-top-assets-linea.json';
import bridgeTopAssetsJson from './bridge-top-assets.json';
import chainidChainsJson from './chainid-chains.json';
import chompJson from './chomp.json';
import clientConfigEventsJson from './client-config-events.json';
import clientConfigNetworksJson from './client-config-networks.json';
import clientSideDetectionJson from './client-side-detection.json';
import contentfulBannersJson from './contentful-banners.json';
import gasPricesJson from './gas-prices.json';
import geolocationV2Json from './geolocation-v2.json';
import moneyPositionsJson from './money-positions.json';
import onRampNetworksJson from './on-ramp-networks.json';
import phishingStalelistJson from './phishing-stalelist.json';
import priceSupportedNetworksJson from './price-supported-networks.json';
import priceV1BtcJson from './price-v1-btc.json';
import priceV1ExchangeRatesJson from './price-v1-exchange-rates.json';
import priceV3SpotJson from './price-v3-spot.json';
import rampsCountriesJson from './ramps-countries.json';
import signatureInsightsSignatureJson from './signature-insights-signature.json';
import suggestedGasFeesJson from './suggested-gas-fees.json';
import swapsFeatureFlagsJson from './swaps-feature-flags.json';
import swapsTokenJson from './swaps-token.json';
import swapsTokensJson from './swaps-tokens.json';
import tokenBlocklistJson from './token-blocklist.json';
import tokenListJson from './token-list.json';
import tokenMetadataJson from './token-metadata.json';
import tokenOccurrenceFloorsJson from './token-occurrence-floors.json';
import tokenSupportedNetworksJson from './token-supported-networks.json';
import tokensSupportedNetworksJson from './tokens-supported-networks.json';
import tokensV3AssetsJson from './tokens-v3-assets.json';
import txSentinelBatchStatusJson from './tx-sentinel-batch-status.json';
import txSentinelGetFeesJson from './tx-sentinel-get-fees.json';
import txSentinelNetworkJson from './tx-sentinel-network.json';
import txSentinelNetworksJson from './tx-sentinel-networks.json';
import {
  defineApiMock,
  placeholderOf,
  withOverrides,
  type Overrides,
} from './define-api-mock';
import type * as Wallet from './wallet-types';

export {
  defineApiMock,
  findDuplicateEndpoints,
  placeholderOf,
  withOverrides,
  type ApiMock,
  type ApiMockDefinition,
  type DefaultMockContext,
  type Overrides,
} from './define-api-mock';

const BRIDGE_API = String.raw`^https:\/\/bridge\.(?:api|dev-api)\.cx\.metamask\.io`;
const TX_SENTINEL_API = String.raw`^https:\/\/tx-sentinel-[\w-]+\.api\.cx\.metamask\.io`;
const ANY_QUERY = String.raw`(?:\?.*)?$`;

type ChainParams = { chainId: number };
type SentinelParams = { baseUrl: string };
type SentinelChainParams = SentinelParams & ChainParams;

type ExchangeRateTicker = keyof typeof priceV1ExchangeRatesJson;
type SpotPrice = (typeof priceV3SpotJson)['eip155:1/slip44:60'];
type TokensV3Asset = (typeof tokensV3AssetsJson)[number];
type TokenListToken = (typeof tokenListJson)[0];
type BridgeToken = (typeof bridgeGetTokensSearchJson)['data'][number];
type BalanceRow = (typeof accountsBalancesV5Json)['balances'][number];
type FourByteSignature = (typeof fourByteSignaturesJson)['results'][number];
type TxSentinelBatchStatus =
  (typeof txSentinelBatchStatusJson)[keyof typeof txSentinelBatchStatusJson];
type TxSentinelNetwork = Omit<typeof txSentinelNetworkJson, 'cubistSigners'> & {
  cubistSigners: string[];
};

/** One spot-prices entry. `id` is the Price API slug, e.g. `ethereum`. */
export type SpotPriceInput = Pick<SpotPrice, 'id'> &
  Overrides<SpotPrice> & { assetPriceType?: 'fungible' };

export type TokensV3AssetInput = Pick<TokensV3Asset, 'assetId'> &
  Overrides<TokensV3Asset> & { occurrences?: number };

export type TokenListTokenInput = Pick<TokenListToken, 'address'> &
  Overrides<TokenListToken>;

export type BridgeTokenInput = Pick<BridgeToken, 'address' | 'assetId'> &
  Overrides<BridgeToken> & {
    aggregators?: string[];
    securityData?: Record<string, unknown>;
  };

export type BalanceRowInput = Pick<
  BalanceRow,
  'accountId' | 'assetId' | 'balance'
> &
  Overrides<BalanceRow>;

export type FourByteSignatureInput = Pick<
  FourByteSignature,
  'hex_signature' | 'text_signature'
> &
  Overrides<FourByteSignature>;

export type TxSentinelBatchStatusInput = {
  uuid: string;
} & Overrides<TxSentinelBatchStatus>;

// The token row renders an absent change as "-" and a `0` as "+0.00%", so
// `pricePercentChange1d` is not filled.
type SpotPriceEntry = Omit<SpotPrice, 'pricePercentChange1d'> & {
  pricePercentChange1d?: number;
  assetPriceType?: 'fungible';
};

const spotPriceEntry = (input: SpotPriceInput): SpotPriceEntry => {
  const { pricePercentChange1d: _unset, ...placeholder } = placeholderOf(
    priceV3SpotJson['eip155:1/slip44:60'],
  );
  return { ...placeholder, ...input };
};

export const fourByteSignatures = defineApiMock({
  id: '4byte-signatures',
  method: 'GET',
  url: 'https://www.4byte.directory/api/v1/signatures/',
  syncUrl: 'https://www.4byte.directory/api/v1/signatures/',
  body: fourByteSignaturesJson,
  defaultMock: {},
  build: (signature: FourByteSignatureInput) => ({
    ...fourByteSignaturesJson,
    results: [
      { ...placeholderOf(fourByteSignaturesJson.results[0]), ...signature },
    ],
  }),
});

export const gasPrices = defineApiMock({
  id: 'gas-prices',
  method: 'GET',
  url: new RegExp(
    String.raw`^https:\/\/gas\.api\.cx\.metamask\.io\/networks\/\d+\/gasPrices${ANY_QUERY}`,
    'u',
  ),
  urlFor: ({ chainId }: ChainParams) =>
    `https://gas.api.cx.metamask.io/networks/${chainId}/gasPrices`,
  syncUrl: 'https://gas.api.cx.metamask.io/networks/1/gasPrices',
  body: gasPricesJson satisfies Wallet.SwapsGasPrices,
  defaultMock: {
    params: ({ chainId }) => ({ chainId: chainId === 1337 ? 1 : chainId }),
  },
});

export const txSentinelNetwork = defineApiMock({
  id: 'tx-sentinel-network',
  method: 'GET',
  url: new RegExp(`${TX_SENTINEL_API}\\/network$`, 'u'),
  urlFor: ({ baseUrl }: SentinelParams) => `${baseUrl}/network`,
  syncUrl: 'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/network',
  body: txSentinelNetworkJson as TxSentinelNetwork,
  defaultMock: {},
});

export const txSentinelNetworks = defineApiMock({
  id: 'tx-sentinel-networks',
  method: 'GET',
  url: new RegExp(`${TX_SENTINEL_API}\\/networks$`, 'u'),
  syncUrl: 'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/networks',
  body: txSentinelNetworksJson,
  defaultMock: {},
});

export const txSentinelBatchStatus = defineApiMock({
  id: 'tx-sentinel-batch-status',
  method: 'GET',
  url: new RegExp(
    `${TX_SENTINEL_API}\\/v1\\/networks\\/\\d+\\/batchStatus${ANY_QUERY}`,
    'u',
  ),
  urlFor: ({ baseUrl, chainId }: SentinelChainParams) =>
    `${baseUrl}/v1/networks/${chainId}/batchStatus`,
  syncUrl:
    'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/v1/networks/1/batchStatus?uuids=0d506aaa-5e38-4cab-ad09-2039cb7a0f33',
  body: txSentinelBatchStatusJson,
  build: ({ uuid, ...overrides }: TxSentinelBatchStatusInput) => {
    const [status] = Object.values(txSentinelBatchStatusJson);
    return { [uuid]: withOverrides(status, overrides) };
  },
});

export const txSentinelGetFees = defineApiMock({
  id: 'tx-sentinel-get-fees',
  method: 'POST',
  url: new RegExp(`${TX_SENTINEL_API}\\/v1\\/networks\\/\\d+\\/getFees$`, 'u'),
  urlFor: ({ baseUrl, chainId }: SentinelChainParams) =>
    `${baseUrl}/v1/networks/${chainId}/getFees`,
  syncUrl:
    'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/v1/networks/1/getFees',
  body: txSentinelGetFeesJson,
});

export const tokenList = defineApiMock({
  id: 'token-list',
  method: 'GET',
  url: new RegExp(
    String.raw`^https:\/\/token\.api\.cx\.metamask\.io\/tokens\/\d+${ANY_QUERY}`,
    'u',
  ),
  urlFor: ({ chainId }: ChainParams) =>
    `https://token.api.cx.metamask.io/tokens/${chainId}`,
  syncUrl: 'https://token.api.cx.metamask.io/tokens/1',
  body: tokenListJson satisfies Wallet.TokenListToken[],
  defaultMock: { params: ({ chainId }) => ({ chainId }) },
  build: (tokens: TokenListTokenInput[]): TokenListToken[] =>
    tokens.map((token) =>
      withOverrides(placeholderOf(tokenListJson[0]), token),
    ),
});

export const tokensV3Assets = defineApiMock({
  id: 'tokens-v3-assets',
  method: 'GET',
  url: 'https://tokens.api.cx.metamask.io/v3/assets',
  syncUrl:
    'https://tokens.api.cx.metamask.io/v3/assets?assetIds=eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  body: tokensV3AssetsJson,
  build: (assets: TokensV3AssetInput[]) =>
    assets.map((asset): TokensV3Asset & { occurrences?: number } => ({
      ...placeholderOf(tokensV3AssetsJson[0]),
      ...asset,
    })),
});

export const priceV3Spot = defineApiMock({
  id: 'price-v3-spot',
  method: 'GET',
  url: 'https://price.api.cx.metamask.io/v3/spot-prices',
  syncUrl:
    'https://price.api.cx.metamask.io/v3/spot-prices?assetIds=eip155:1/slip44:60,eip155:143/slip44:268435779,solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501,bip122:000000000019d6689c085ae165831e93/slip44:0&vsCurrency=usd&includeMarketData=true',
  body: priceV3SpotJson satisfies Record<string, Wallet.SpotPrice>,
  build: (prices: Record<string, SpotPriceInput>) =>
    Object.fromEntries(
      Object.entries(prices).map(([assetId, price]) => [
        assetId,
        spotPriceEntry(price),
      ]),
    ),
});

export const priceV1ExchangeRates = defineApiMock({
  id: 'price-v1-exchange-rates',
  method: 'GET',
  url: 'https://price.api.cx.metamask.io/v1/exchange-rates',
  syncUrl:
    'https://price.api.cx.metamask.io/v1/exchange-rates?baseCurrency=usd',
  // Keyed by ticker: the sync aligns the tickers the fixture has and adds none.
  syncMapPaths: [''],
  body: priceV1ExchangeRatesJson,
  build: (values: Partial<Record<ExchangeRateTicker, number>>) =>
    Object.fromEntries(
      Object.entries(values).map(([ticker, value]) => {
        const rate = priceV1ExchangeRatesJson[ticker as ExchangeRateTicker];
        if (!rate) {
          throw new Error(`No exchange rate fixture for "${ticker}"`);
        }
        return [ticker, { ...rate, value }];
      }),
    ),
});

export const accountsSupportedNetworksV2 = defineApiMock({
  id: 'accounts-supported-networks-v2',
  method: 'GET',
  url: 'https://accounts.api.cx.metamask.io/v2/supportedNetworks',
  syncUrl: 'https://accounts.api.cx.metamask.io/v2/supportedNetworks',
  body: accountsSupportedNetworksV2Json,
  defaultMock: { always: true },
});

export const accountsBalancesV5 = defineApiMock({
  id: 'accounts-balances-v5',
  method: 'GET',
  url: 'https://accounts.api.cx.metamask.io/v5/multiaccount/balances',
  syncUrl:
    'https://accounts.api.cx.metamask.io/v5/multiaccount/balances?accountIds=eip155:1:0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  body: accountsBalancesV5Json,
  build: (balances: BalanceRowInput[]) => ({
    ...accountsBalancesV5Json,
    count: balances.length,
    balances: balances.map((row) => ({
      ...placeholderOf(accountsBalancesV5Json.balances[0]),
      ...row,
    })),
  }),
});

export const bridgeGetTxStatus = defineApiMock({
  id: 'bridge-get-tx-status',
  method: 'GET',
  url: new RegExp(`${BRIDGE_API}\\/getTxStatus${ANY_QUERY}`, 'u'),
  syncUrl:
    'https://bridge.api.cx.metamask.io/getTxStatus?srcTxHash=0xec9d6214684d6dc191133ae4a7ec97db3e521fff9cfe5c4f48a84cb6c93a5fa5&srcChainId=1&destChainId=59144',
  syncSkip:
    'the live API now requires a bridgeId and answers HTTP 400 for this transaction',
  body: bridgeGetTxStatusJson,
});

export const bridgeGetTokensPopular = defineApiMock({
  id: 'bridge-get-tokens-popular',
  method: 'POST',
  url: new RegExp(`${BRIDGE_API}\\/getTokens\\/popular${ANY_QUERY}`, 'u'),
  syncUrl: 'https://bridge.api.cx.metamask.io/getTokens/popular',
  body: bridgeGetTokensPopularJson,
  build: (tokens: BridgeTokenInput[]) =>
    tokens.map((token) => ({
      ...placeholderOf(bridgeGetTokensPopularJson[0]),
      ...token,
    })),
});

export const bridgeGetTokensSearch = defineApiMock({
  id: 'bridge-get-tokens-search',
  method: 'POST',
  url: new RegExp(`${BRIDGE_API}\\/getTokens\\/search${ANY_QUERY}`, 'u'),
  syncUrl: 'https://bridge.api.cx.metamask.io/getTokens/search',
  body: bridgeGetTokensSearchJson,
  build: (tokens: BridgeTokenInput[]) => ({
    ...bridgeGetTokensSearchJson,
    data: tokens.map((token) => ({
      ...placeholderOf(bridgeGetTokensSearchJson.data[0]),
      ...token,
    })),
  }),
});

export const signatureInsightsSignature = defineApiMock({
  id: 'signature-insights-signature',
  method: 'POST',
  url: 'https://signature-insights.api.cx.metamask.io/v1/signature',
  syncUrl: 'https://signature-insights.api.cx.metamask.io/v1/signature',
  body: signatureInsightsSignatureJson,
});

export const accountsSupportedNetworksV1 = defineApiMock({
  id: 'accounts-supported-networks-v1',
  method: 'GET',
  url: 'https://accounts.api.cx.metamask.io/v1/supportedNetworks',
  syncUrl: 'https://accounts.api.cx.metamask.io/v1/supportedNetworks',
  body: accountsSupportedNetworksV1Json,
  defaultMock: {},
});

export const accountsTransactions = defineApiMock({
  id: 'accounts-transactions',
  method: 'GET',
  url: 'https://accounts.api.cx.metamask.io/v5/multiaccount/transactions',
  syncUrl:
    'https://accounts.api.cx.metamask.io/v5/multiaccount/transactions?accountIds=eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045&limit=1',
  body: accountsTransactionsJson,
});

export const bridgeAggregatorMetadata = defineApiMock({
  id: 'bridge-aggregator-metadata',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/networks/1/aggregatorMetadata',
  syncUrl: 'https://bridge.api.cx.metamask.io/networks/1/aggregatorMetadata',
  body: bridgeAggregatorMetadataJson,
  defaultMock: {},
});

export const bridgeAggregatorMetadataLinea = defineApiMock({
  id: 'bridge-aggregator-metadata-linea',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/networks/59144/aggregatorMetadata',
  syncUrl:
    'https://bridge.api.cx.metamask.io/networks/59144/aggregatorMetadata',
  body: bridgeAggregatorMetadataLineaJson,
  defaultMock: {},
});

/**
 * The bridge token list a chain's swaps page loads with
 * `includeBlockedTokens=true`. Without that query the request is `swapsTokens`.
 *
 * @param chainId - The chain the list is for.
 * @returns The matcher.
 */
const bridgeTokensUrl = (chainId: number) =>
  new RegExp(
    String.raw`^https:\/\/bridge\.api\.cx\.metamask\.io\/networks\/${chainId}\/tokens\?(?:.*&)?includeBlockedTokens=true(?:&.*)?$`,
    'u',
  );

export const bridgeTokens = defineApiMock({
  id: 'bridge-tokens',
  method: 'GET',
  url: bridgeTokensUrl(1),
  syncUrl:
    'https://bridge.api.cx.metamask.io/networks/1/tokens?includeBlockedTokens=true',
  body: bridgeTokensJson satisfies Wallet.SwapsToken[],
  defaultMock: {},
});

export const bridgeTokensLinea = defineApiMock({
  id: 'bridge-tokens-linea',
  method: 'GET',
  url: bridgeTokensUrl(59144),
  syncUrl:
    'https://bridge.api.cx.metamask.io/networks/59144/tokens?includeBlockedTokens=true',
  body: bridgeTokensLineaJson satisfies Wallet.SwapsToken[],
  defaultMock: {},
});

export const bridgeTopAssets = defineApiMock({
  id: 'bridge-top-assets',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/networks/1/topAssets',
  syncUrl: 'https://bridge.api.cx.metamask.io/networks/1/topAssets',
  body: bridgeTopAssetsJson,
  defaultMock: {},
});

export const bridgeTopAssetsLinea = defineApiMock({
  id: 'bridge-top-assets-linea',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/networks/59144/topAssets',
  syncUrl: 'https://bridge.api.cx.metamask.io/networks/59144/topAssets',
  body: bridgeTopAssetsLineaJson,
  defaultMock: {},
});

export const chainidChains = defineApiMock({
  id: 'chainid-chains',
  method: 'GET',
  url: 'https://chainid.network/chains.json',
  syncUrl: 'https://chainid.network/chains.json',
  body: chainidChainsJson,
  defaultMock: {},
});

export const chomp = defineApiMock({
  id: 'chomp',
  method: 'GET',
  url: 'https://chomp.api.cx.metamask.io/v1/chomp',
  syncUrl: 'https://chomp.api.cx.metamask.io/v1/chomp',
  body: chompJson,
  defaultMock: {},
});

// Config registry: networks config (ConfigRegistryController polling) and
// events config (AnalyticsController event-purpose classification). Without
// them the catch-all returns an empty body, which fails JSON parsing.
export const clientConfigNetworks = defineApiMock({
  id: 'client-config-networks',
  method: 'GET',
  url: 'https://client-config.api.cx.metamask.io/v1/config/networks',
  syncUrl: 'https://client-config.api.cx.metamask.io/v1/config/networks',
  body: clientConfigNetworksJson,
});

export const clientConfigEvents = defineApiMock({
  id: 'client-config-events',
  method: 'GET',
  url: 'https://client-config.api.cx.metamask.io/v1/config/events-config',
  syncUrl: 'https://client-config.api.cx.metamask.io/v1/config/events-config',
  body: clientConfigEventsJson,
});

export const clientSideDetection = defineApiMock({
  id: 'client-side-detection',
  method: 'GET',
  url: 'https://client-side-detection.api.cx.metamask.io/v1/request-blocklist',
  syncUrl:
    'https://client-side-detection.api.cx.metamask.io/v1/request-blocklist',
  body: clientSideDetectionJson,
  defaultMock: {},
});

type ContentfulAsset = NonNullable<
  NonNullable<Wallet.ContentfulBannerResponse['includes']>['Asset']
>[number];

/**
 * Assets to serve from a Contentful banner response. The synced fixture can
 * omit `includes`, and its placeholder asset has an empty id.
 *
 * @param response - Contentful body.
 * @returns Assets that have an id.
 */
export function contentfulServedAssets(
  response: Pick<Wallet.ContentfulBannerResponse, 'includes'>,
): ContentfulAsset[] {
  return (response.includes?.Asset ?? []).filter((asset) => asset.sys.id);
}

export const contentfulBanners = defineApiMock({
  id: 'contentful-banners',
  method: 'GET',
  url: /^https:\/\/(cdn|preview)\.contentful\.com\/.*$/u,
  syncUrl:
    'https://cdn.contentful.com/spaces/$CONTENTFUL_ACCESS_SPACE_ID/environments/master/entries?access_token=$CONTENTFUL_ACCESS_TOKEN&content_type=promotionalBanner&fields.showInExtension=true',
  body: contentfulBannersJson satisfies Wallet.ContentfulBannerResponse,
});

export const geolocationV2 = defineApiMock({
  id: 'geolocation-v2',
  method: 'GET',
  url: new RegExp(
    String.raw`^https:\/\/geolocation\.(?:api|dev-api)\.cx\.metamask\.io\/v2\/geolocation${ANY_QUERY}`,
    'u',
  ),
  syncUrl: 'https://geolocation.api.cx.metamask.io/v2/geolocation',
  body: geolocationV2Json,
  defaultMock: {},
});

export const moneyPositions = defineApiMock({
  id: 'money-positions',
  method: 'GET',
  url: /^https:\/\/money\.api\.cx\.metamask\.io\/v1\/positions\/[^/]+$/u,
  syncUrl:
    'https://money.api.cx.metamask.io/v1/positions/0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  body: moneyPositionsJson,
});

export const onRampNetworks = defineApiMock({
  id: 'on-ramp-networks',
  method: 'GET',
  url: 'https://on-ramp-content.api.cx.metamask.io/regions/networks',
  syncUrl: 'https://on-ramp-content.api.cx.metamask.io/regions/networks',
  body: onRampNetworksJson,
  defaultMock: {},
});

/** Served by `mockEmptyStalelistAndHotlist`, which empties its lists. */
export const phishingStalelist = defineApiMock({
  id: 'phishing-stalelist',
  method: 'GET',
  url: 'https://phishing-detection.api.cx.metamask.io/v1/stalelist',
  syncUrl: 'https://phishing-detection.api.cx.metamask.io/v1/stalelist',
  body: phishingStalelistJson,
});

export const priceSupportedNetworks = defineApiMock({
  id: 'price-supported-networks',
  method: 'GET',
  url: 'https://price.api.cx.metamask.io/v2/supportedNetworks',
  syncUrl: 'https://price.api.cx.metamask.io/v2/supportedNetworks',
  body: priceSupportedNetworksJson,
});

export const priceV1Btc = defineApiMock({
  id: 'price-v1-btc',
  method: 'GET',
  url: 'https://price.api.cx.metamask.io/v1/spot-prices/bitcoin',
  syncUrl:
    'https://price.api.cx.metamask.io/v1/spot-prices/bitcoin?vsCurrency=usd',
  body: priceV1BtcJson,
});

export const rampsCountries = defineApiMock({
  id: 'ramps-countries',
  method: 'GET',
  url: new RegExp(
    String.raw`^https:\/\/on-ramp(?:-cache\.api|-cache\.uat-api|\.dev-api)\.cx\.metamask\.io\/v2\/regions\/countries${ANY_QUERY}`,
    'u',
  ),
  syncUrl: 'https://on-ramp-cache.api.cx.metamask.io/v2/regions/countries',
  body: rampsCountriesJson satisfies Wallet.RampsCountry[],
});

export const suggestedGasFees = defineApiMock({
  id: 'suggested-gas-fees',
  method: 'GET',
  url: new RegExp(
    String.raw`^https:\/\/gas\.api\.cx\.metamask\.io\/networks\/\d+\/suggestedGasFees${ANY_QUERY}`,
    'u',
  ),
  urlFor: ({ chainId }: ChainParams) =>
    `https://gas.api.cx.metamask.io/networks/${chainId}/suggestedGasFees`,
  syncUrl: 'https://gas.api.cx.metamask.io/networks/1/suggestedGasFees',
  body: suggestedGasFeesJson satisfies Wallet.SuggestedGasFees,
  defaultMock: { params: ({ chainId }) => ({ chainId }) },
});

export const swapsFeatureFlags = defineApiMock({
  id: 'swaps-feature-flags',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/featureFlags',
  syncUrl: 'https://bridge.api.cx.metamask.io/featureFlags',
  syncMapPaths: [''],
  body: swapsFeatureFlagsJson,
  defaultMock: {},
});

export const swapsToken = defineApiMock({
  id: 'swaps-token',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/networks/1/token',
  syncUrl:
    'https://bridge.api.cx.metamask.io/networks/1/token?address=0x72c9Fb7ED19D3ce51cea5C56B3e023cd918baaDf',
  body: swapsTokenJson,
});

export const swapsTokens = defineApiMock({
  id: 'swaps-tokens',
  method: 'GET',
  url: 'https://bridge.api.cx.metamask.io/networks/1/tokens',
  syncUrl: 'https://bridge.api.cx.metamask.io/networks/1/tokens',
  body: swapsTokensJson,
  defaultMock: {},
});

export const tokenBlocklist = defineApiMock({
  id: 'token-blocklist',
  method: 'GET',
  url: 'https://tokens.api.cx.metamask.io/blocklist',
  syncUrl:
    'https://tokens.api.cx.metamask.io/blocklist?chainId=1&region=global',
  body: tokenBlocklistJson,
});

export const tokenMetadata = defineApiMock({
  id: 'token-metadata',
  method: 'GET',
  url: new RegExp(
    String.raw`^https:\/\/token\.api\.cx\.metamask\.io\/token\/\d+${ANY_QUERY}`,
    'u',
  ),
  urlFor: ({ chainId }: ChainParams) =>
    `https://token.api.cx.metamask.io/token/${chainId}`,
  syncUrl:
    'https://token.api.cx.metamask.io/token/1?address=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  body: tokenMetadataJson,
});

export const tokenOccurrenceFloors = defineApiMock({
  id: 'token-occurrence-floors',
  method: 'GET',
  url: 'https://token.api.cx.metamask.io/v1/suggestedOccurrenceFloors',
  syncUrl: 'https://token.api.cx.metamask.io/v1/suggestedOccurrenceFloors',
  body: tokenOccurrenceFloorsJson,
  defaultMock: { always: true },
});

// Rpc token detection calls token.api; TokenDataSource calls tokens.api.
export const tokenSupportedNetworks = defineApiMock({
  id: 'token-supported-networks',
  method: 'GET',
  url: 'https://token.api.cx.metamask.io/v2/supportedNetworks',
  syncUrl: 'https://token.api.cx.metamask.io/v2/supportedNetworks',
  body: tokenSupportedNetworksJson,
  defaultMock: { always: true },
});

export const tokensSupportedNetworks = defineApiMock({
  id: 'tokens-supported-networks',
  method: 'GET',
  url: 'https://tokens.api.cx.metamask.io/v2/supportedNetworks',
  syncUrl: 'https://tokens.api.cx.metamask.io/v2/supportedNetworks',
  body: tokensSupportedNetworksJson,
  defaultMock: { always: true },
});

/**
 * Every endpoint, keyed by its fixture id. `mock-e2e.js` registers the
 * defaults in this order, so `bridge-tokens` (with `includeBlockedTokens`)
 * comes before `swaps-tokens` for the same path.
 */
export const API_ENDPOINTS = {
  '4byte-signatures': fourByteSignatures,
  'accounts-balances-v5': accountsBalancesV5,
  'accounts-supported-networks-v1': accountsSupportedNetworksV1,
  'accounts-supported-networks-v2': accountsSupportedNetworksV2,
  'accounts-transactions': accountsTransactions,
  'bridge-aggregator-metadata': bridgeAggregatorMetadata,
  'bridge-aggregator-metadata-linea': bridgeAggregatorMetadataLinea,
  'bridge-get-tokens-popular': bridgeGetTokensPopular,
  'bridge-get-tokens-search': bridgeGetTokensSearch,
  'bridge-get-tx-status': bridgeGetTxStatus,
  'bridge-tokens': bridgeTokens,
  'bridge-tokens-linea': bridgeTokensLinea,
  'bridge-top-assets': bridgeTopAssets,
  'bridge-top-assets-linea': bridgeTopAssetsLinea,
  'chainid-chains': chainidChains,
  chomp,
  'client-config-events': clientConfigEvents,
  'client-config-networks': clientConfigNetworks,
  'client-side-detection': clientSideDetection,
  'contentful-banners': contentfulBanners,
  'gas-prices': gasPrices,
  'geolocation-v2': geolocationV2,
  'money-positions': moneyPositions,
  'on-ramp-networks': onRampNetworks,
  'phishing-stalelist': phishingStalelist,
  'price-supported-networks': priceSupportedNetworks,
  'price-v1-btc': priceV1Btc,
  'price-v1-exchange-rates': priceV1ExchangeRates,
  'price-v3-spot': priceV3Spot,
  'ramps-countries': rampsCountries,
  'signature-insights-signature': signatureInsightsSignature,
  'suggested-gas-fees': suggestedGasFees,
  'swaps-feature-flags': swapsFeatureFlags,
  'swaps-token': swapsToken,
  'swaps-tokens': swapsTokens,
  'token-blocklist': tokenBlocklist,
  'token-list': tokenList,
  'token-metadata': tokenMetadata,
  'token-occurrence-floors': tokenOccurrenceFloors,
  'token-supported-networks': tokenSupportedNetworks,
  'tokens-supported-networks': tokensSupportedNetworks,
  'tokens-v3-assets': tokensV3Assets,
  'tx-sentinel-batch-status': txSentinelBatchStatus,
  'tx-sentinel-get-fees': txSentinelGetFees,
  'tx-sentinel-network': txSentinelNetwork,
  'tx-sentinel-networks': txSentinelNetworks,
} as const;
