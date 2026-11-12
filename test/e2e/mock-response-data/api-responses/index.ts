/**
 * Shared response bodies for API mocks registered by E2E tests and helpers.
 *
 * Each JSON file holds the response of one live endpoint, named by its fixture
 * id. Tests take the body from here and only override the values they assert,
 * so a fixture can be kept in line with the live API shape without changing
 * the tests that use it.
 */
import fourByteSignatures from './4byte-signatures.json';
import accountsV2SupportedNetworks from './accounts-v2-supported-networks.json';
import accountsV5MultiaccountBalances from './accounts-v5-multiaccount-balances.json';
import bridgeGetTokensPopular from './bridge-get-tokens-popular.json';
import bridgeGetTokensSearch from './bridge-get-tokens-search.json';
import bridgeGetTxStatus from './bridge-get-tx-status.json';
import gasPrices from './gas-prices.json';
import priceV1ExchangeRates from './price-v1-exchange-rates.json';
import priceV3SpotPrices from './price-v3-spot-prices.json';
import signatureInsightsSignature from './signature-insights-signature.json';
import tokenTokens from './token-tokens.json';
import tokensV3Assets from './tokens-v3-assets.json';
import txSentinelBatchStatus from './tx-sentinel-batch-status.json';
import txSentinelGetFees from './tx-sentinel-get-fees.json';
import txSentinelNetwork from './tx-sentinel-network.json';

export const API_RESPONSES = {
  '4byte-signatures': fourByteSignatures,
  'accounts-v2-supported-networks': accountsV2SupportedNetworks,
  'accounts-v5-multiaccount-balances': accountsV5MultiaccountBalances,
  'bridge-get-tokens-popular': bridgeGetTokensPopular,
  'bridge-get-tokens-search': bridgeGetTokensSearch,
  'bridge-get-tx-status': bridgeGetTxStatus,
  'gas-prices': gasPrices,
  'price-v1-exchange-rates': priceV1ExchangeRates,
  'price-v3-spot-prices': priceV3SpotPrices,
  'signature-insights-signature': signatureInsightsSignature,
  'token-tokens': tokenTokens,
  'tokens-v3-assets': tokensV3Assets,
  'tx-sentinel-batch-status': txSentinelBatchStatus,
  'tx-sentinel-get-fees': txSentinelGetFees,
  'tx-sentinel-network': txSentinelNetwork,
} as const;

type ExchangeRateTicker = keyof typeof priceV1ExchangeRates;
type SpotPrice = (typeof priceV3SpotPrices)['eip155:1/slip44:60'];
type TokensV3Asset = (typeof tokensV3Assets)[number];
type TokenListToken = (typeof tokenTokens)[number];
type BridgeToken = (typeof bridgeGetTokensSearch)['data'][number];
type FourByteSignature = (typeof fourByteSignatures)['results'][number];
type TxSentinelBatchStatus =
  (typeof txSentinelBatchStatus)[keyof typeof txSentinelBatchStatus];

/**
 * Builds a `price.api` `/v1/exchange-rates` body with the given rates.
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
 * Builds one asset entry of a `price.api` `/v3/spot-prices` body.
 *
 * @param overrides - Values the test asserts.
 * @returns The spot price entry.
 */
export function buildSpotPrice<Overrides extends Partial<SpotPrice>>(
  overrides: Overrides & Record<string, unknown>,
): SpotPrice & Overrides {
  return { ...priceV3SpotPrices['eip155:1/slip44:60'], ...overrides };
}

/**
 * Builds one entry of a `tokens.api` `/v3/assets` body.
 *
 * @param overrides - Values the test asserts.
 * @returns The asset entry.
 */
export function buildTokensV3Asset<Overrides extends Partial<TokensV3Asset>>(
  overrides: Overrides & Record<string, unknown>,
): TokensV3Asset & Overrides {
  return { ...tokensV3Assets[0], ...overrides };
}

/**
 * Builds one entry of a `token.api` `/tokens/<chainId>` body.
 *
 * @param overrides - Values the test asserts.
 * @returns The token list entry.
 */
export function buildTokenListToken<Overrides extends Partial<TokenListToken>>(
  overrides: Overrides,
): TokenListToken & Overrides {
  return { ...tokenTokens[0], ...overrides };
}

/**
 * Builds an `accounts.api` `/v2/supportedNetworks` body.
 *
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildAccountsSupportedNetworksV2(
  overrides: Partial<typeof accountsV2SupportedNetworks>,
) {
  return { ...accountsV2SupportedNetworks, ...overrides };
}

/**
 * Builds an `accounts.api` `/v5/multiaccount/balances` body.
 *
 * @param balances - Balance rows the test asserts.
 * @returns The response body.
 */
export function buildMultiaccountBalancesV5<
  Row extends Record<string, unknown>,
>(balances: Row[]) {
  return {
    ...accountsV5MultiaccountBalances,
    count: balances.length,
    balances: balances.map((row) => ({
      ...accountsV5MultiaccountBalances.balances[0],
      ...row,
    })),
  };
}

/**
 * Builds a bridge `getTxStatus` body.
 *
 * @param overrides - Values the test asserts. `srcChain` and `destChain` merge
 * with the fixture.
 * @param overrides.srcChain - Source chain values.
 * @param overrides.destChain - Destination chain values.
 * @returns The response body.
 */
export function buildBridgeTxStatus({
  srcChain,
  destChain,
  ...overrides
}: Partial<Omit<typeof bridgeGetTxStatus, 'srcChain' | 'destChain'>> & {
  srcChain?: Partial<(typeof bridgeGetTxStatus)['srcChain']>;
  destChain?: Partial<(typeof bridgeGetTxStatus)['destChain']>;
}) {
  return {
    ...bridgeGetTxStatus,
    ...overrides,
    srcChain: { ...bridgeGetTxStatus.srcChain, ...srcChain },
    destChain: { ...bridgeGetTxStatus.destChain, ...destChain },
  };
}

/**
 * Builds one token of a bridge `getTokens/popular` body.
 *
 * @param token - Token values the test asserts.
 * @returns The token entry.
 */
export function buildBridgePopularToken<Token extends Partial<BridgeToken>>(
  token: Token,
): BridgeToken & Token {
  return { ...bridgeGetTokensPopular[0], ...token };
}

/**
 * Builds a bridge `getTokens/search` body.
 *
 * @param tokens - Tokens the test asserts.
 * @returns The response body.
 */
export function buildBridgeTokensSearch<Token extends Partial<BridgeToken>>(
  tokens: Token[],
) {
  return {
    ...bridgeGetTokensSearch,
    data: tokens.map((token) => ({
      ...bridgeGetTokensSearch.data[0],
      ...token,
    })),
  };
}

/**
 * Builds a `gas.api` `/networks/<chainId>/gasPrices` body.
 *
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildGasPrices(overrides: Partial<typeof gasPrices> = {}) {
  return { ...gasPrices, ...overrides };
}

/**
 * Builds a tx-sentinel `/network` body.
 *
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildTxSentinelNetwork(
  overrides: Partial<typeof txSentinelNetwork> = {},
) {
  return { ...txSentinelNetwork, ...overrides };
}

/**
 * Builds a tx-sentinel `/v1/networks/<chainId>/batchStatus` body.
 *
 * @param uuid - The smart transaction UUID the status is for.
 * @param overrides - Values the test asserts.
 * @returns The response body.
 */
export function buildTxSentinelBatchStatus(
  uuid: string,
  overrides: Partial<TxSentinelBatchStatus> & Record<string, unknown> = {},
) {
  const [status] = Object.values(txSentinelBatchStatus);
  return { [uuid]: { ...status, ...overrides } };
}

/**
 * Builds a 4byte.directory `/api/v1/signatures/` body with one result.
 *
 * @param signature - The signature the test asserts.
 * @returns The response body.
 */
export function buildFourByteSignatures(signature: Partial<FourByteSignature>) {
  return {
    ...fourByteSignatures,
    results: [{ ...fourByteSignatures.results[0], ...signature }],
  };
}
