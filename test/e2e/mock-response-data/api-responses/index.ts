/** Shared API mock bodies, one JSON file per endpoint. See README.md. */
import fourByteSignatures from './4byte-signatures.json';
import accountsBalancesV5 from './accounts-balances-v5.json';
import accountsSupportedNetworksV2 from './accounts-supported-networks-v2.json';
import bridgeGetTokensPopular from './bridge-get-tokens-popular.json';
import bridgeGetTokensSearch from './bridge-get-tokens-search.json';
import bridgeGetTxStatus from './bridge-get-tx-status.json';
import gasPrices from './gas-prices.json';
import priceV1ExchangeRates from './price-v1-exchange-rates.json';
import priceV3Spot from './price-v3-spot.json';
import signatureInsightsSignature from './signature-insights-signature.json';
import tokenList from './token-list.json';
import tokensV3Assets from './tokens-v3-assets.json';
import txSentinelBatchStatus from './tx-sentinel-batch-status.json';
import txSentinelGetFees from './tx-sentinel-get-fees.json';
import txSentinelNetwork from './tx-sentinel-network.json';

export const API_RESPONSES = {
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

/** Values a test sets on top of a fixture. Nested objects are partial too. */
export type Overrides<Fixture> = {
  [Key in keyof Fixture]?: Fixture[Key] extends readonly unknown[]
    ? Fixture[Key]
    : Fixture[Key] extends object
      ? Overrides<Fixture[Key]>
      : Fixture[Key];
};

type ExchangeRateTicker = keyof typeof priceV1ExchangeRates;
type SpotPrice = (typeof priceV3Spot)['eip155:1/slip44:60'];
type TokensV3Asset = (typeof tokensV3Assets)[number];
type TokenListToken = (typeof tokenList)[0];
type BridgeToken = (typeof bridgeGetTokensSearch)['data'][number];
type BalanceRow = (typeof accountsBalancesV5)['balances'][number];
type FourByteSignature = (typeof fourByteSignatures)['results'][number];
type TxSentinelBatchStatus =
  (typeof txSentinelBatchStatus)[keyof typeof txSentinelBatchStatus];
type TxSentinelNetwork = Omit<typeof txSentinelNetwork, 'cubistSigners'> & {
  cubistSigners: string[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Fixture first, then the test's values: nested objects merge, while arrays
 * and scalars from `overrides` replace the fixture's. Same rule as #47760's
 * `withPins`, so fields a sync adds to the fixture reach the wallet.
 *
 * @param fixture - The fixture body.
 * @param overrides - Values the test asserts.
 * @returns The merged body.
 */
export function withOverrides<Fixture extends object>(
  fixture: Fixture,
  overrides: Overrides<Fixture>,
): Fixture {
  const merged = { ...fixture } as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    const base = merged[key];
    merged[key] =
      isPlainObject(base) && isPlainObject(value)
        ? withOverrides(base, value)
        : value;
  }
  return merged as Fixture;
}

const PRIMITIVE_PLACEHOLDERS: Record<string, unknown> = {
  number: 0,
  string: '',
  boolean: false,
};

/**
 * The fixture entry's fields with none of its values, matching #47760's
 * `placeholder`. A list or record entry describes one asset, so an entry for
 * another asset takes only its shape and never its id or market data.
 *
 * @param value - A fixture value.
 * @returns The same shape with neutral values.
 */
export function placeholderOf<Value>(value: Value): Value {
  if (Array.isArray(value)) {
    return (
      value.length > 0 && isPlainObject(value[0])
        ? [placeholderOf(value[0])]
        : []
    ) as Value;
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, placeholderOf(item)]),
    ) as Value;
  }
  return (PRIMITIVE_PLACEHOLDERS[typeof value] ?? null) as Value;
}

/**
 * Builds a price.api /v1/exchange-rates body. Each ticker keeps its own
 * fixture entry, with the given rate.
 *
 * @param values - Rate per ticker. Only these tickers are returned.
 * @returns The response body.
 */
export function buildExchangeRates(
  values: Partial<Record<ExchangeRateTicker, number>>,
) {
  return Object.fromEntries(
    Object.entries(values).map(([ticker, value]) => {
      const rate = priceV1ExchangeRates[ticker as ExchangeRateTicker];
      if (!rate) {
        throw new Error(`No exchange rate fixture for "${ticker}"`);
      }
      return [ticker, { ...rate, value }];
    }),
  );
}

/**
 * Builds one price.api /v3/spot-prices entry for any asset.
 *
 * @param overrides - The asset's `id` and the values the test asserts.
 * @returns The spot price entry.
 */
export function buildSpotPrice(
  overrides: Pick<SpotPrice, 'id'> &
    Overrides<SpotPrice> & { assetPriceType?: 'fungible' },
): SpotPrice & { assetPriceType?: 'fungible' } {
  return {
    ...placeholderOf(priceV3Spot['eip155:1/slip44:60']),
    ...overrides,
  };
}

/**
 * Builds one tokens.api /v3/assets entry.
 *
 * @param overrides - The `assetId` and the values the test asserts.
 * @returns The asset entry.
 */
export function buildTokensV3Asset(
  overrides: Pick<TokensV3Asset, 'assetId'> &
    Overrides<TokensV3Asset> & { occurrences?: number },
): TokensV3Asset & { occurrences?: number } {
  return { ...placeholderOf(tokensV3Assets[0]), ...overrides };
}

/**
 * Builds one token.api /tokens/<chainId> entry.
 *
 * @param overrides - The token `address` and the values the test asserts.
 * @returns The token list entry.
 */
export function buildTokenListToken(
  overrides: Pick<TokenListToken, 'address'> & Overrides<TokenListToken>,
): TokenListToken {
  return withOverrides(placeholderOf(tokenList[0]), overrides);
}

/**
 * Builds an accounts.api /v2/supportedNetworks body.
 *
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildAccountsSupportedNetworksV2(
  overrides: Overrides<typeof accountsSupportedNetworksV2>,
) {
  return withOverrides(accountsSupportedNetworksV2, overrides);
}

/**
 * Builds an accounts.api /v5/multiaccount/balances body.
 *
 * @param balances - One row per balance: `accountId`, `assetId` and the values
 * the test asserts.
 * @returns The response body.
 */
export function buildMultiaccountBalancesV5(
  balances: (Pick<BalanceRow, 'accountId' | 'assetId'> &
    Overrides<BalanceRow>)[],
) {
  return {
    ...accountsBalancesV5,
    count: balances.length,
    balances: balances.map((row) => ({
      ...placeholderOf(accountsBalancesV5.balances[0]),
      ...row,
    })),
  };
}

/**
 * Builds a bridge getTxStatus body.
 *
 * @param overrides - Values the test asserts. `srcChain` and `destChain` merge
 * with the fixture's.
 * @returns The response body.
 */
export function buildBridgeTxStatus(
  overrides: Overrides<typeof bridgeGetTxStatus>,
) {
  return withOverrides(bridgeGetTxStatus, overrides);
}

type BridgeTokenOverrides = Pick<BridgeToken, 'address' | 'assetId'> &
  Overrides<BridgeToken> & {
    aggregators?: string[];
    securityData?: Record<string, unknown>;
  };

/**
 * Builds one token of a bridge getTokens/popular body.
 *
 * @param token - The token's `address`, `assetId` and asserted values.
 * @returns The token entry.
 */
export function buildBridgePopularToken(token: BridgeTokenOverrides) {
  return { ...placeholderOf(bridgeGetTokensPopular[0]), ...token };
}

/**
 * Builds a bridge getTokens/search body.
 *
 * @param tokens - Each token's `address`, `assetId` and asserted values.
 * @returns The response body.
 */
export function buildBridgeTokensSearch(tokens: BridgeTokenOverrides[]) {
  return {
    ...bridgeGetTokensSearch,
    data: tokens.map((token) => ({
      ...placeholderOf(bridgeGetTokensSearch.data[0]),
      ...token,
    })),
  };
}

/**
 * Builds a gas.api /networks/<chainId>/gasPrices body.
 *
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildGasPrices(overrides: Overrides<typeof gasPrices> = {}) {
  return withOverrides(gasPrices, overrides);
}

/**
 * Builds a tx-sentinel /network body.
 *
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildTxSentinelNetwork(
  overrides: Overrides<TxSentinelNetwork> = {},
) {
  return withOverrides<TxSentinelNetwork>(txSentinelNetwork, overrides);
}

/**
 * Builds a tx-sentinel batchStatus body keyed by the given UUID.
 *
 * @param uuid - The smart transaction UUID the status is for.
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildTxSentinelBatchStatus(
  uuid: string,
  overrides: Overrides<TxSentinelBatchStatus> = {},
) {
  const [status] = Object.values(txSentinelBatchStatus);
  return { [uuid]: withOverrides(status, overrides) };
}

/**
 * Builds a 4byte.directory /api/v1/signatures/ body with one result.
 *
 * @param signature - The signature's `hex_signature`, `text_signature` and
 * other asserted values.
 * @returns The response body.
 */
export function buildFourByteSignatures(
  signature: Pick<FourByteSignature, 'hex_signature' | 'text_signature'> &
    Overrides<FourByteSignature>,
) {
  return {
    ...fourByteSignatures,
    results: [
      { ...placeholderOf(fourByteSignatures.results[0]), ...signature },
    ],
  };
}
