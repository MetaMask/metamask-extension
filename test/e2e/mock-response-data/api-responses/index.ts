/** E2E API mocks, one definition and one JSON fixture per endpoint. See README.md. */
import fourByteSignaturesJson from './4byte-signatures.json';
import accountsBalancesV5Json from './accounts-balances-v5.json';
import accountsSupportedNetworksV2Json from './accounts-supported-networks-v2.json';
import bridgeGetTokensPopularJson from './bridge-get-tokens-popular.json';
import bridgeGetTokensSearchJson from './bridge-get-tokens-search.json';
import bridgeGetTxStatusJson from './bridge-get-tx-status.json';
import gasPricesJson from './gas-prices.json';
import priceV1ExchangeRatesJson from './price-v1-exchange-rates.json';
import priceV3SpotJson from './price-v3-spot.json';
import signatureInsightsSignatureJson from './signature-insights-signature.json';
import tokenListJson from './token-list.json';
import tokensV3AssetsJson from './tokens-v3-assets.json';
import txSentinelBatchStatusJson from './tx-sentinel-batch-status.json';
import txSentinelGetFeesJson from './tx-sentinel-get-fees.json';
import txSentinelNetworkJson from './tx-sentinel-network.json';
import {
  defineApiMock,
  placeholderOf,
  withOverrides,
  type Overrides,
} from './define-api-mock';

export {
  defineApiMock,
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

const spotPriceEntry = (
  input: SpotPriceInput,
): SpotPrice & { assetPriceType?: 'fungible' } => ({
  ...placeholderOf(priceV3SpotJson['eip155:1/slip44:60']),
  ...input,
});

export const fourByteSignatures = defineApiMock({
  id: '4byte-signatures',
  method: 'GET',
  url: 'https://www.4byte.directory/api/v1/signatures/',
  syncUrl: 'https://www.4byte.directory/api/v1/signatures/',
  body: fourByteSignaturesJson,
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
  body: gasPricesJson,
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
  body: tokenListJson,
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
  body: priceV3SpotJson,
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

/** Every endpoint, keyed by its fixture id. */
export const API_ENDPOINTS = {
  '4byte-signatures': fourByteSignatures,
  'accounts-balances-v5': accountsBalancesV5,
  'accounts-supported-networks-v2': accountsSupportedNetworksV2,
  'bridge-get-tokens-popular': bridgeGetTokensPopular,
  'bridge-get-tokens-search': bridgeGetTokensSearch,
  'bridge-get-tx-status': bridgeGetTxStatus,
  'gas-prices': gasPrices,
  'price-v1-exchange-rates': priceV1ExchangeRates,
  'price-v3-spot': priceV3Spot,
  'signature-insights-signature': signatureInsightsSignature,
  'token-list': tokenList,
  'tokens-v3-assets': tokensV3Assets,
  'tx-sentinel-batch-status': txSentinelBatchStatus,
  'tx-sentinel-get-fees': txSentinelGetFees,
  'tx-sentinel-network': txSentinelNetwork,
} as const;
