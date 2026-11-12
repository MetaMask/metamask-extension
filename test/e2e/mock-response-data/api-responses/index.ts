/**
 * Shared response bodies for API mocks registered by E2E tests and helpers.
 *
 * Each JSON file holds the response of one live endpoint, named by its fixture
 * id. Tests take the body from here and only override the values they assert,
 * so a fixture can be kept in line with the live API shape without changing
 * the tests that use it.
 *
 * `sources.json` is the sync manifest for these files, not a response body,
 * so it is not imported here.
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

/** Builds a price.api /v1/exchange-rates body with the given rates. */
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

/** Builds one price.api /v3/spot-prices entry, keeping fixture fields the test does not override. */
export function buildSpotPrice<Overrides extends Partial<SpotPrice>>(
  overrides: Overrides & Record<string, unknown>,
): SpotPrice & Overrides {
  return { ...priceV3SpotPrices['eip155:1/slip44:60'], ...overrides };
}

/** Builds one tokens.api /v3/assets entry. */
export function buildTokensV3Asset<Overrides extends Partial<TokensV3Asset>>(
  overrides: Overrides & Record<string, unknown>,
): TokensV3Asset & Overrides {
  return { ...tokensV3Assets[0], ...overrides };
}

/** Builds one token.api /tokens/<chainId> entry. */
export function buildTokenListToken<Overrides extends Partial<TokenListToken>>(
  overrides: Overrides,
): TokenListToken & Overrides {
  return { ...tokenTokens[0], ...overrides };
}

/** Builds an accounts.api /v2/supportedNetworks body. */
export function buildAccountsSupportedNetworksV2(
  overrides: Partial<typeof accountsV2SupportedNetworks>,
) {
  return { ...accountsV2SupportedNetworks, ...overrides };
}

/** Builds an accounts.api /v5/multiaccount/balances body from the given rows. */
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

/** Builds a bridge getTxStatus body, merging srcChain and destChain over the fixture. */
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

/** Builds one token of a bridge getTokens/popular body. */
export function buildBridgePopularToken<Token extends Partial<BridgeToken>>(
  token: Token,
): BridgeToken & Token {
  return { ...bridgeGetTokensPopular[0], ...token };
}

/** Builds a bridge getTokens/search body. */
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

/** Builds a gas.api /networks/<chainId>/gasPrices body. */
export function buildGasPrices(overrides: Partial<typeof gasPrices> = {}) {
  return { ...gasPrices, ...overrides };
}

/** Builds a tx-sentinel /network body. */
export function buildTxSentinelNetwork(
  overrides: Partial<typeof txSentinelNetwork> = {},
) {
  return { ...txSentinelNetwork, ...overrides };
}

/** Builds a tx-sentinel batchStatus body keyed by the given UUID. */
export function buildTxSentinelBatchStatus(
  uuid: string,
  overrides: Partial<TxSentinelBatchStatus> & Record<string, unknown> = {},
) {
  const [status] = Object.values(txSentinelBatchStatus);
  return { [uuid]: { ...status, ...overrides } };
}

/** Builds a 4byte.directory /api/v1/signatures/ body with one result. */
export function buildFourByteSignatures(signature: Partial<FourByteSignature>) {
  return {
    ...fourByteSignatures,
    results: [{ ...fourByteSignatures.results[0], ...signature }],
  };
}
