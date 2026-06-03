import type { Hex, Json } from '@metamask/utils';
import type { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT_LOWERCASE } from '../../constants';
import {
  getProductionRemoteFlagApiResponse,
  getProductionRemoteFlagDefaults,
} from '../../feature-flags/feature-flag-registry';
import { formatUnits } from '../../../../shared/lib/unit';
import {
  MOCK_ETH_OPEN_LONG_FILL,
  MOCK_ETH_LIMIT_ORDER,
  MOCK_ETH_FUNDING,
  MOCK_USDC_DEPOSIT,
} from './mocks/websocketActivityMocks';

/**
 * Production remote flag defaults used as the base for Perps remote flag state
 * and HTTP mocks. Starting from these ensures any flag added to the registry is
 * automatically included without having to update this file.
 */
const PROD_REMOTE_FLAGS = getProductionRemoteFlagDefaults();
const {
  // Omitted from generic Perps manifest flags because the production payload is
  // large and the withdraw confirmation tests provide a small explicit override.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_pay_post_quote: _confirmationsPayPostQuote,
  ...PERPS_PROD_REMOTE_FLAGS
} = PROD_REMOTE_FLAGS;

const ARBITRUM_CHAIN_ID = '0xa4b1';
const ARBITRUM_CHAIN_ID_DECIMAL = Number(ARBITRUM_CHAIN_ID);
const ARBITRUM_USDC_ADDRESS: Hex = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const ARBITRUM_USDC_PRICE_IN_ETH = 1 / 1700;
const HYPERCORE_CHAIN_ID = '0x539';
const HYPERCORE_CHAIN_ID_DECIMAL = Number(HYPERCORE_CHAIN_ID);
const PRICE_API_BASE_URL = 'https://price.api.cx.metamask.io';
const RELAY_API_BASE_URL = 'https://api.relay.link';
const RELAY_REQUEST_ID = 'perps-withdraw-e2e-request-id';
const RELAY_TRANSACTION_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

const PERPS_WITHDRAW_CONFIRMATION_DISABLED_FLAG = {
  overrides: {
    perpsWithdraw: {
      enabled: false,
    },
  },
};

const PERPS_WITHDRAW_CONFIRMATION_ENABLED_FLAG = {
  overrides: {
    perpsWithdraw: {
      enabled: true,
    },
  },
};

const ARBITRUM_USDC_MARKET_DATA = {
  tokenAddress: ARBITRUM_USDC_ADDRESS,
  currency: 'ETH',
  allTimeHigh: 1,
  allTimeLow: 1,
  circulatingSupply: 0,
  dilutedMarketCap: 0,
  high1d: 1,
  low1d: 1,
  marketCap: 0,
  marketCapPercentChange1d: 0,
  price: ARBITRUM_USDC_PRICE_IN_ETH,
  priceChange1d: 0,
  pricePercentChange1d: 0,
  pricePercentChange1h: 0,
  pricePercentChange1y: 0,
  pricePercentChange7d: 0,
  pricePercentChange14d: 0,
  pricePercentChange30d: 0,
  pricePercentChange200d: 0,
  totalVolume: 0,
};

type RelayQuoteRequestBody = {
  amount?: string;
  user?: string;
};

const PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS = {
  ...PERPS_PROD_REMOTE_FLAGS,
  // Keep existing Perps E2E coverage on the legacy withdraw page unless a test
  // explicitly opts into the confirmation flow.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_pay_post_quote: PERPS_WITHDRAW_CONFIRMATION_DISABLED_FLAG,
  perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
  perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: [] },
};

/**
 * Keep the manifest override small for Firefox's manifest size limit. The full
 * production-default flag set is seeded into RemoteFeatureFlagController state.
 */
export const PERPS_ELIGIBLE_FLAG = {
  remoteFeatureFlags: {
    perpsEnabledVersion:
      PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS.perpsEnabledVersion,
    perpsPerpTradingGeoBlockedCountriesV2:
      PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS.perpsPerpTradingGeoBlockedCountriesV2,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    confirmations_pay_post_quote:
      PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS.confirmations_pay_post_quote,
  },
};

export const PERPS_WITHDRAW_CONFIRMATION_FLAG = {
  remoteFeatureFlags: {
    ...PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    confirmations_pay_post_quote: PERPS_WITHDRAW_CONFIRMATION_ENABLED_FLAG,
  },
};

/**
 * Keep the manifest override small for Firefox's manifest size limit. The full
 * production-default flag set is seeded into RemoteFeatureFlagController state.
 */
const PERPS_WITHDRAW_CONFIRMATION_MANIFEST_FLAG = {
  remoteFeatureFlags: {
    perpsEnabledVersion:
      PERPS_WITHDRAW_CONFIRMATION_FLAG.remoteFeatureFlags.perpsEnabledVersion,
    perpsPerpTradingGeoBlockedCountriesV2:
      PERPS_WITHDRAW_CONFIRMATION_FLAG.remoteFeatureFlags
        .perpsPerpTradingGeoBlockedCountriesV2,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    confirmations_pay_post_quote:
      PERPS_WITHDRAW_CONFIRMATION_FLAG.remoteFeatureFlags
        .confirmations_pay_post_quote,
  },
};

/**
 * Remote feature flags for geo-blocked (ineligible) users.
 * The geolocation mock returns 'US-TX', so blocking 'US' makes the user ineligible.
 * EligibilityService.checkEligibility checks geoLocation.startsWith(blockedRegion).
 */
const PERPS_GEO_BLOCKED_REMOTE_FEATURE_FLAGS = {
  ...PROD_REMOTE_FLAGS,
  // Keep existing Perps E2E coverage on the legacy withdraw page unless a test
  // explicitly opts into the confirmation flow.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_pay_post_quote:
    PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS.confirmations_pay_post_quote,
  perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
  perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: ['US'] },
};

const PERPS_GEO_BLOCKED_FLAG = {
  remoteFeatureFlags: {
    perpsEnabledVersion:
      PERPS_GEO_BLOCKED_REMOTE_FEATURE_FLAGS.perpsEnabledVersion,
    perpsPerpTradingGeoBlockedCountriesV2:
      PERPS_GEO_BLOCKED_REMOTE_FEATURE_FLAGS.perpsPerpTradingGeoBlockedCountriesV2,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    confirmations_pay_post_quote:
      PERPS_GEO_BLOCKED_REMOTE_FEATURE_FLAGS.confirmations_pay_post_quote,
  },
};

/**
 * Perps E2E fixture for geo-block tests: enables perps with geo-block flags and HTTP flag mock.
 * Sets `useExternalServices: false` so eligibility monitoring never starts:
 * without `GeolocationController:getGeolocation` on PerpsControllerMessenger,
 * `refreshEligibility()` would fail and perps-controller would set `isEligible`
 * to true, hiding the geo-block modal. Deferred checks keep `isEligible: false`.
 * Callers must use `login(..., { waitForNonEvmAccounts: false })` because the
 * home flow otherwise waits for non-EVM account icons that do not load when
 * basic functionality is off.
 *
 * Also sets isFirstTimeUser to false so the tutorial modal does not intercept clicks.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsGeoBlockConfig(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isFirstTimeUser: { mainnet: false, testnet: false },
        isEligible: false,
      })
      .withRemoteFeatureFlagController({
        remoteFeatureFlags: PERPS_GEO_BLOCKED_REMOTE_FEATURE_FLAGS,
      })
      .build(),
    title,
    manifestFlags: PERPS_GEO_BLOCKED_FLAG,
    /**
     * Override /v1/flags so the background RemoteFeatureFlagController sees
     * perpsPerpTradingGeoBlockedCountriesV2 with blockedRegions: ['US'].
     * The geolocation mock returns 'US-TX', so startsWith('US') → ineligible.
     *
     * manifestFlags.remoteFeatureFlags only affects the UI selector; the
     * background reads client-config when external services are on. This mock
     * reinforces US blocking for tests that enable eligibility refresh.
     * @param server
     */
    testSpecificMock: async (server: Mockttp) => {
      const geoBlockedFlags = getProductionRemoteFlagApiResponseWithOverrides({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmations_pay_post_quote:
          PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS.confirmations_pay_post_quote,
        perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: ['US'] },
      });
      await server
        .forGet('https://client-config.api.cx.metamask.io/v1/flags')
        .withQuery({ client: 'extension', distribution: 'main' })
        .thenCallback(() => ({
          ok: true,
          statusCode: 200,
          json: geoBlockedFlags,
        }));
    },
  };
}

function getProductionRemoteFlagApiResponseWithOverrides(
  overrides: Record<string, Json>,
): Json[] {
  const overrideNames = new Set(Object.keys(overrides));

  return [
    ...getProductionRemoteFlagApiResponse().filter(
      (entry) =>
        !Object.keys(entry as Record<string, Json>).some((name) =>
          overrideNames.has(name),
        ),
    ),
    ...Object.entries(overrides).map(([name, value]) => ({ [name]: value })),
  ];
}

/**
 * Registers the eligible feature-flag HTTP mock on `server`.
 * Overrides /v1/flags so the background RemoteFeatureFlagController sees
 * `perpsPerpTradingGeoBlockedCountriesV2` with `blockedRegions: []`,
 * keeping US-TX eligible.
 *
 * Extracted to avoid duplicating this logic across config functions that
 * all need the same flag mock alongside their own additional mocks.
 *
 * @param server - The Mockttp server instance to register the mock on.
 */
async function mockEligibleFeatureFlags(server: Mockttp): Promise<void> {
  const eligibleFlags = getProductionRemoteFlagApiResponseWithOverrides({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    confirmations_pay_post_quote:
      PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS.confirmations_pay_post_quote,
    perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: [] },
  });
  await server
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: eligibleFlags,
    }));
}

async function mockArbitrumUsdcPriceData(server: Mockttp): Promise<void> {
  await server
    .forGet(`${PRICE_API_BASE_URL}/v1/exchange-rates`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: ARBITRUM_USDC_PRICE_IN_ETH,
          currencyType: 'crypto',
        },
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
      },
    }));
}

function getArbitrumUsdcRawAmount(sourceRawAmount: string): string {
  try {
    return (BigInt(sourceRawAmount) / 100n).toString();
  } catch {
    return '0';
  }
}

async function mockRelayWithdrawData(server: Mockttp): Promise<void> {
  await server
    .forPost(`${RELAY_API_BASE_URL}/quote`)
    .always()
    .thenCallback(async (request) => {
      const body =
        ((await request.body.getJson()) as RelayQuoteRequestBody | undefined) ??
        {};
      const sourceRawAmount =
        typeof body.amount === 'string' ? body.amount : '0';

      if (sourceRawAmount === '0') {
        return {
          statusCode: 400,
          json: {
            message: 'Amount is required',
          },
        };
      }

      const targetRawAmount = getArbitrumUsdcRawAmount(sourceRawAmount);
      const formattedAmount = formatUnits(BigInt(targetRawAmount), 6);
      const user =
        typeof body.user === 'string'
          ? body.user
          : DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;

      return {
        statusCode: 200,
        json: {
          details: {
            currencyIn: {
              amount: sourceRawAmount,
              amountFormatted: formattedAmount,
              amountUsd: formattedAmount,
              currency: {
                chainId: HYPERCORE_CHAIN_ID_DECIMAL,
                decimals: 8,
              },
            },
            currencyOut: {
              amount: targetRawAmount,
              amountFormatted: formattedAmount,
              amountUsd: formattedAmount,
              currency: {
                chainId: ARBITRUM_CHAIN_ID_DECIMAL,
                decimals: 6,
              },
              minimumAmount: targetRawAmount,
            },
            timeEstimate: 60,
            totalImpact: {
              usd: '0',
            },
          },
          fees: {
            app: {
              amountUsd: '0',
            },
            relayer: {
              amountUsd: '0',
            },
          },
          metamask: {
            gasLimits: [],
            is7702: false,
          },
          steps: [
            {
              id: 'authorize',
              items: [
                {
                  data: {
                    sign: {
                      signatureKind: 'eip712',
                      domain: {
                        name: 'Relay',
                        version: '1',
                        chainId: ARBITRUM_CHAIN_ID_DECIMAL,
                        verifyingContract:
                          '0x0000000000000000000000000000000000000000',
                      },
                      types: {
                        Authorize: [
                          { name: 'nonce', type: 'uint256' },
                          { name: 'user', type: 'address' },
                        ],
                      },
                      value: {
                        nonce: '1',
                        user,
                      },
                      primaryType: 'Authorize',
                    },
                    post: {
                      endpoint: `${RELAY_API_BASE_URL}/authorize`,
                      method: 'POST',
                      body: {
                        requestId: RELAY_REQUEST_ID,
                      },
                    },
                  },
                  status: 'incomplete',
                },
              ],
              kind: 'signature',
              requestId: RELAY_REQUEST_ID,
            },
            {
              id: 'deposit',
              items: [
                {
                  check: {
                    endpoint: 'https://api.hyperliquid.xyz/exchange',
                    method: 'POST',
                  },
                  data: {
                    action: {
                      type: 'sendAsset',
                      parameters: {
                        destination: user,
                        token: 'USDC',
                        amount: formattedAmount,
                        time: '1',
                      },
                    },
                    nonce: 1,
                    eip712PrimaryType: 'HyperliquidTransaction',
                    eip712Types: {
                      HyperliquidTransaction: [
                        { name: 'destination', type: 'address' },
                        { name: 'token', type: 'string' },
                        { name: 'amount', type: 'string' },
                        { name: 'time', type: 'string' },
                        { name: 'type', type: 'string' },
                        { name: 'signatureChainId', type: 'string' },
                      ],
                    },
                  },
                  status: 'incomplete',
                },
              ],
              kind: 'transaction',
              requestId: RELAY_REQUEST_ID,
            },
          ],
        },
      };
    });

  await server
    .forPost(`${RELAY_API_BASE_URL}/authorize`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: { status: 'ok' },
    }));

  await server
    .forGet(`${RELAY_API_BASE_URL}/intents/status/v3`)
    .withQuery({ requestId: RELAY_REQUEST_ID })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        status: 'success',
        inTxHashes: [RELAY_TRANSACTION_HASH],
        txHashes: [RELAY_TRANSACTION_HASH],
        updatedAt: Date.now(),
        originChainId: HYPERCORE_CHAIN_ID_DECIMAL,
        destinationChainId: ARBITRUM_CHAIN_ID_DECIMAL,
      },
    }));
}

/**
 * withFixtures config for Perps E2E tests with an eligible (non-geo-blocked) user.
 * Use this for tests that exercise trading actions (Long/Short, Add Funds, Close All).
 *
 * The geolocation mock returns 'US-TX'. The production default for
 * `perpsPerpTradingGeoBlockedCountriesV2` blocks US, so this config overrides it
 * to `blockedRegions: []` both in `manifestFlags` (UI) and via `testSpecificMock`
 * (background RemoteFeatureFlagController).
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfigEligible(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isEligible: true,
        isFirstTimeUser: { mainnet: false, testnet: false },
      })
      .withRemoteFeatureFlagController({
        remoteFeatureFlags: PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS,
      })
      .build(),
    title,
    manifestFlags: PERPS_ELIGIBLE_FLAG,
    testSpecificMock: (server: Mockttp) => mockEligibleFeatureFlags(server),
  };
}

/**
 * Eligible Perps fixture for the Withdraw confirmation flow.
 *
 * The confirmation selects Arbitrum USDC as its destination token immediately
 * on load. Pre-seeding token metadata and rates avoids depending on async token
 * discovery before `TransactionPayController` resolves that token.
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfigEligibleWithArbitrumUsdc(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isEligible: true,
        isFirstTimeUser: { mainnet: false, testnet: false },
      })
      .withRemoteFeatureFlagController({
        remoteFeatureFlags: PERPS_WITHDRAW_CONFIRMATION_FLAG.remoteFeatureFlags,
      })
      .withTokensController({
        allTokens: {
          [ARBITRUM_CHAIN_ID]: {
            [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: [
              {
                address: ARBITRUM_USDC_ADDRESS,
                symbol: 'USDC',
                image: `https://static.cx.metamask.io/api/v1/tokenIcons/42161/${ARBITRUM_USDC_ADDRESS.toLowerCase()}.png`,
                isERC721: false,
                decimals: 6,
                aggregators: ['metamask'],
                name: 'USD Coin',
              },
            ],
          },
        },
      })
      .withTokenRatesController({
        marketData: {
          [ARBITRUM_CHAIN_ID]: {
            [ARBITRUM_USDC_ADDRESS]: ARBITRUM_USDC_MARKET_DATA,
          },
        },
      })
      .withCurrencyController({
        currencyRates: {
          ETH: {
            conversionDate: 0,
            conversionRate: 1700,
            usdConversionRate: 1700,
          },
        },
      })
      .build(),
    title,
    manifestFlags: PERPS_WITHDRAW_CONFIRMATION_MANIFEST_FLAG,
    testSpecificMock: async (server: Mockttp) => {
      await mockEligibleFeatureFlags(server);
      await mockArbitrumUsdcPriceData(server);
      await mockRelayWithdrawData(server);
    },
  };
}

/**
 * withFixtures config for Perps Activity E2E tests.
 *
 * Extends the eligible config by adding HTTP mock overrides for all four
 * activity transaction types. Uses `withJsonBodyIncluding` so only the
 * specific request types are intercepted; everything else (clearinghouseState,
 * meta, allMids, etc.) falls through to the global mock-e2e.js handlers.
 *
 * Activity data injected:
 * - Trades:   one ETH "Open Long" fill  (`userFills`)
 * - Orders:   one ETH Limit buy order   (`openOrders`)
 * - Funding:  one ETH funding payment   (`userFunding`)
 * - Deposits: one USDC deposit entry    (`userNonFundingLedgerUpdates`)
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfigEligibleWithActivity(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isEligible: true,
        isFirstTimeUser: { mainnet: false, testnet: false },
      })
      .withRemoteFeatureFlagController({
        remoteFeatureFlags: PERPS_ELIGIBLE_REMOTE_FEATURE_FLAGS,
      })
      .build(),
    title,
    manifestFlags: PERPS_ELIGIBLE_FLAG,
    testSpecificMock: async (server: Mockttp) => {
      await mockEligibleFeatureFlags(server);

      // Override userFills — returns an ETH open-long fill for the Trades filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'userFills' })
        .thenCallback(() => ({
          statusCode: 200,
          json: [MOCK_ETH_OPEN_LONG_FILL],
        }));

      // Override openOrders — returns an ETH limit buy for the Orders filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'openOrders' })
        .thenCallback(() => ({
          statusCode: 200,
          json: [MOCK_ETH_LIMIT_ORDER],
        }));

      // Override userFunding — returns an ETH funding payment for the Funding filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'userFunding' })
        .thenCallback(() => ({ statusCode: 200, json: [MOCK_ETH_FUNDING] }));

      // Override userNonFundingLedgerUpdates — returns a USDC deposit for the Deposits filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'userNonFundingLedgerUpdates' })
        .thenCallback(() => ({ statusCode: 200, json: [MOCK_USDC_DEPOSIT] }));
    },
  };
}
