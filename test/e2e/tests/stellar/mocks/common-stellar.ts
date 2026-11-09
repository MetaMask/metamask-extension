/* eslint-disable @typescript-eslint/naming-convention */
import { MockedEndpoint, Mockttp } from 'mockttp';
import { getProductionRemoteFlagApiResponse } from '../../../feature-flags';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  DEFAULT_STELLAR_ADDRESS,
  EXPECTED_STELLAR_ADDRESSES_BY_INDEX,
} from '../../../constants';

export const STELLAR_NETWORK_NAME = 'Stellar';
export const STELLAR_CHAIN_ID = 'stellar:pubnet';
export const STELLAR_NATIVE_ASSET_ID = `${STELLAR_CHAIN_ID}/slip44:148`;
export const STELLAR_ACCOUNT_ADDRESS = DEFAULT_STELLAR_ADDRESS;

/** Circle USDC on Stellar pubnet (classic asset used across product tests). */
export const STELLAR_USDC_ISSUER =
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
export const STELLAR_USDC_ASSET_ID = `${STELLAR_CHAIN_ID}/asset:USDC-${STELLAR_USDC_ISSUER}`;

/** Funded mock balance: 100 XLM. */
export const XLM_BALANCE = '100.0000000';
export const XLM_TO_USD_RATE = 0.4;
/** Expected homepage native balance string for funded account. */
export const XLM_BALANCE_DISPLAY = '100 XLM';
/** Expected homepage fiat for funded account (100 * $0.4). */
export const XLM_FIAT_DISPLAY = '$40.00';

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

/**
 * Preinstalled stellar-wallet-snap Horizon hosts (see snap bundle config).
 * Public Horizon is kept for local/dev snaps that still point at stellar.org.
 */
/**
 * Preinstalled stellar-wallet-snap Horizon hosts (Infura) plus public Horizon
 * for local/dev snaps. Path-only `/horizon/accounts/…` forms also match via
 * mockttp's RegexPathMatcher dual absolute/path test.
 */
const HORIZON_ACCOUNT_RE =
  /(?:^https:\/\/(?:horizon\.stellar\.org|stellar-(?:mainnet|testnet)\.infura\.io\/v3\/[^/?#]+\/horizon)|(?:^|\/)horizon)\/accounts\/([A-Z0-9]{56})\/?(?:[?#].*)?$/iu;

/**
 * Unlike Tron/BTC, the XLM provider starts disabled and only turns on when
 * `stellarAccounts` is enabled in RemoteFeatureFlagController state (see
 * `MultichainAccountServiceInit`). Seed it in fixtures + HTTP mocks.
 */
export const STELLAR_ACCOUNTS_FLAG = {
  enabled: true,
  minimumVersion: '13.50.0',
} as const;

// BIP44 Stage 2 feature flags - enables automatic multichain account creation
export const BIP44_STAGE_TWO = {
  enableMultichainAccountsState2: {
    enabled: true,
    featureVersion: '2',
    minimumVersion: '12.19.0',
  },
  bitcoinAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
  tronAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
  stellarAccounts: STELLAR_ACCOUNTS_FLAG,
};

/**
 * Fixture RemoteFeatureFlagController state so the XLM provider is enabled at
 * MultichainAccountService init (default fixtures omit stellarAccounts).
 */
export const STELLAR_REMOTE_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    stellarAccounts: STELLAR_ACCOUNTS_FLAG,
    enableMultichainAccountsState2: {
      enabled: true,
      featureVersion: '2',
      minimumVersion: '12.19.0',
    },
  },
} as const;

/**
 * Console noise from EVM RPC while on Stellar (no Anvil / Infura). Same idea as
 * Tron derivation's `includeAnvil: false` + `ignoredConsoleErrors`.
 */
export const STELLAR_IGNORED_CONSOLE_ERRORS = [
  'Failed to get nonce',
  'JsonRpcError: Failed to fetch',
];

/**
 * Shared `withFixtures` options for Stellar E2E (no local EVM node).
 *
 * @param options - Per-test withFixtures fields.
 */
export function stellarFixtureOptions<
  T extends {
    ignoredConsoleErrors?: string[];
  },
>(
  options: T,
): Omit<T, 'ignoredConsoleErrors' | 'localNodeOptions'> & {
  localNodeOptions: 'none';
  ignoredConsoleErrors: string[];
} {
  const { ignoredConsoleErrors, ...rest } = options;
  return {
    ...rest,
    localNodeOptions: 'none',
    ignoredConsoleErrors: [
      ...STELLAR_IGNORED_CONSOLE_ERRORS,
      ...(ignoredConsoleErrors ?? []),
    ],
  };
}

export type StellarHorizonBalanceOptions = {
  /** When true, Horizon returns 404 (unfunded / zero balance). */
  unfunded?: boolean;
  /** Native XLM balance as Horizon decimal string. */
  xlmBalance?: string;
  /**
   * Optional classic USDC trustline. When `limit` is `'0'`, the UI should treat
   * the asset as requiring activation (Inactive badge / activate card).
   */
  usdc?: {
    balance: string;
    limit: string;
  };
};

/**
 * Builds a Horizon `/accounts/{id}` JSON body for the given address.
 *
 * @param address - Stellar account id (G…).
 * @param options - Balance / trustline options.
 */
export function buildHorizonAccountResponse(
  address: string,
  options: StellarHorizonBalanceOptions = {},
) {
  const xlmBalance = options.xlmBalance ?? XLM_BALANCE;
  const balances: object[] = [
    {
      balance: xlmBalance,
      buying_liabilities: '0.0000000',
      selling_liabilities: '0.0000000',
      asset_type: 'native',
    },
  ];

  if (options.usdc) {
    balances.unshift({
      balance: options.usdc.balance,
      limit: options.usdc.limit,
      buying_liabilities: '0.0000000',
      selling_liabilities: '0.0000000',
      asset_type: 'credit_alphanum4',
      asset_code: 'USDC',
      asset_issuer: STELLAR_USDC_ISSUER,
      is_authorized: true,
    });
  }

  const subentryCount = options.usdc ? 1 : 0;

  return {
    id: address,
    account_id: address,
    sequence: '1234567890',
    subentry_count: subentryCount,
    num_sponsoring: 0,
    num_sponsored: 0,
    balances,
    signers: [
      {
        weight: 1,
        key: address,
        type: 'ed25519_public_key',
      },
    ],
    thresholds: {
      low_threshold: 0,
      med_threshold: 0,
      high_threshold: 0,
    },
    flags: {
      auth_required: false,
      auth_revocable: false,
      auth_immutable: false,
      auth_clawback_enabled: false,
    },
    data: {},
  };
}

/**
 * Mocks the feature flags endpoint with BIP44 Stage 2 configuration.
 * This enables automatic Stellar account creation.
 *
 * @param mockServer
 */
export async function mockStellarFeatureFlags(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        ...getProductionRemoteFlagApiResponse(),
        BIP44_STAGE_TWO,
        // Same bridge / failover overrides as Tron E2E mocks.
        { bridgeConfig: {} },
        { corePlatformRpcFailoverMode: 'disabled' },
      ],
    }));
}

/**
 * Builds a FixtureBuilderV2 with Stellar accounts enabled in remote flag state
 * so the XLM provider is on at MultichainAccountService init.
 *
 * @param options - Optional fixture builder tweaks.
 * @param options.onboarding - When true, start from onboarding (SRP import).
 * @param options.showNativeTokenAsMainBalanceDisabled - Prefer fiat homepage balance.
 */
export function buildStellarFixture(
  options: {
    onboarding?: boolean;
    showNativeTokenAsMainBalanceDisabled?: boolean;
  } = {},
): FixtureBuilderV2 {
  let builder = new FixtureBuilderV2(
    options.onboarding ? { onboarding: true } : undefined,
  ).withRemoteFeatureFlagController(STELLAR_REMOTE_FEATURE_FLAGS);

  if (options.showNativeTokenAsMainBalanceDisabled) {
    builder = builder.withShowNativeTokenAsMainBalanceDisabled();
  }

  return builder;
}

/**
 * Mocks Horizon account endpoints for known E2E Stellar addresses.
 *
 * @param mockServer - Mockttp server.
 * @param options - Balance / trustline options applied to Account 1; other
 * derived addresses default to the same funded shape unless `unfunded`.
 */
export async function mockHorizonAccounts(
  mockServer: Mockttp,
  options: StellarHorizonBalanceOptions = {},
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(HORIZON_ACCOUNT_RE)
    .always()
    .thenCallback((req) => {
      const match = req.url.match(HORIZON_ACCOUNT_RE);
      const address = match?.[1] ?? '';

      if (options.unfunded) {
        return {
          statusCode: 404,
          json: {
            type: 'https://stellar.org/horizon-errors/not_found',
            title: 'Resource Missing',
            status: 404,
            detail: `Account ${address} not found`,
          },
        };
      }

      // Only seed known HD addresses; unknown G… ids stay 404 so discovery stops.
      if (
        !(EXPECTED_STELLAR_ADDRESSES_BY_INDEX as readonly string[]).includes(
          address,
        )
      ) {
        return {
          statusCode: 404,
          json: {
            type: 'https://stellar.org/horizon-errors/not_found',
            title: 'Resource Missing',
            status: 404,
            detail: `Account ${address} not found`,
          },
        };
      }

      return {
        statusCode: 200,
        json: buildHorizonAccountResponse(address, options),
      };
    });
}

export type StellarAccountTransactionFixture = {
  address: string;
  // Horizon transaction records; kept loose so fixtures can omit unused fields.
  records: object[];
};

const HORIZON_ACCOUNT_TRANSACTIONS_RE =
  /(?:^https:\/\/(?:horizon\.stellar\.org|stellar-(?:mainnet|testnet)\.infura\.io\/v3\/[^/?#]+\/horizon)|(?:^|\/)horizon)\/accounts\/([A-Z0-9]{56})\/transactions\/?(?:[?#].*)?$/iu;

/**
 * Mocks Horizon account transactions list. Defaults to an empty page so sync
 * does not fall through to the empty FALLBACK 200.
 *
 * @param mockServer - Mockttp server.
 * @param fixtures - Optional per-account Horizon transaction pages.
 */
export async function mockHorizonAccountTransactions(
  mockServer: Mockttp,
  fixtures: StellarAccountTransactionFixture[] = [],
): Promise<MockedEndpoint> {
  const byAddress = new Map(
    fixtures.map((fixture) => [fixture.address, fixture.records]),
  );

  return mockServer
    .forGet(HORIZON_ACCOUNT_TRANSACTIONS_RE)
    .always()
    .thenCallback((req) => {
      const address = req.url.match(HORIZON_ACCOUNT_TRANSACTIONS_RE)?.[1] ?? '';
      const records = byAddress.get(address) ?? [];
      return {
        statusCode: 200,
        json: {
          _embedded: { records },
          _links: { self: { href: req.url } },
        },
      };
    });
}

/**
 * Mocks Tokens API v2 supported networks including Stellar pubnet.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarTokensV2SupportedNetworks(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenJson(200, {
      fullSupport: [
        STELLAR_CHAIN_ID,
        'bip122:000000000019d6689c085ae165831e93',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'tron:728126428',
        'eip155:1',
        'eip155:1337',
      ],
      partialSupport: [],
    });
}

/**
 * Mocks Tokens API v3 assets for Stellar native + USDC.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarTokensV3Assets(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
    .always()
    .thenCallback((request) => {
      const assetIds =
        new URL(request.url).searchParams.get('assetIds') ??
        new URL(request.url).searchParams.getAll('assetIds').join(',');

      const results = [];

      if (
        assetIds.includes(STELLAR_NATIVE_ASSET_ID) ||
        assetIds.includes(STELLAR_CHAIN_ID)
      ) {
        results.push({
          assetId: STELLAR_NATIVE_ASSET_ID,
          name: 'Stellar',
          symbol: 'XLM',
          decimals: 7,
          type: 'native',
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/stellar/pubnet/slip44/148.png',
          coingeckoId: 'stellar',
        });
      }

      if (
        assetIds.includes(STELLAR_USDC_ASSET_ID) ||
        assetIds.includes(STELLAR_USDC_ISSUER) ||
        assetIds.includes('USDC')
      ) {
        results.push({
          assetId: STELLAR_USDC_ASSET_ID,
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 7,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/stellar/pubnet/asset/USDC.png',
          coingeckoId: 'usd-coin',
        });
      }

      return { statusCode: 200, json: results };
    });
}

/**
 * Mocks Price API spot prices for XLM (and optional USDC).
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarSpotPrices(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback((request) => {
      const assetIdsParam =
        new URL(request.url).searchParams.get('assetIds') ?? '';
      const requested = assetIdsParam.split(',').filter(Boolean);
      const prices: Record<string, unknown> = {};

      for (const assetId of requested.length
        ? requested
        : [STELLAR_NATIVE_ASSET_ID, STELLAR_USDC_ASSET_ID]) {
        if (assetId === STELLAR_NATIVE_ASSET_ID) {
          prices[assetId] = {
            id: 'stellar',
            price: XLM_TO_USD_RATE,
            marketCap: 1_000_000_000,
            pricePercentChange1d: 0,
          };
        } else if (assetId === STELLAR_USDC_ASSET_ID) {
          prices[assetId] = {
            id: 'usd-coin',
            price: 1,
            marketCap: 1_000_000_000,
            pricePercentChange1d: 0,
          };
        } else {
          prices[assetId] = null;
        }
      }

      return { statusCode: 200, json: prices };
    });
}

/**
 * Mocks fiat exchange-rates used by homepage fiat conversion.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarFiatExchangeRates(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u,
    )
    .always()
    .thenJson(200, {
      usd: 1,
    });
}

export type MockStellarApisOptions = StellarHorizonBalanceOptions & {
  /** Per-account Horizon `/transactions` pages (default: empty). */
  transactions?: StellarAccountTransactionFixture[];
};

/**
 * Full Stellar E2E mock bundle (flags + Horizon + tokens + prices).
 *
 * @param mockServer - Mockttp server.
 * @param options - Horizon balance / transaction options.
 */
export async function mockStellarApis(
  mockServer: Mockttp,
  options: MockStellarApisOptions = {},
): Promise<MockedEndpoint[]> {
  const { transactions, ...horizonAccountOptions } = options;
  return [
    await mockStellarFeatureFlags(mockServer),
    await mockHorizonAccounts(mockServer, horizonAccountOptions),
    await mockHorizonAccountTransactions(mockServer, transactions),
    await mockStellarTokensV2SupportedNetworks(mockServer),
    await mockStellarTokensV3Assets(mockServer),
    await mockStellarSpotPrices(mockServer),
    await mockStellarFiatExchangeRates(mockServer),
  ];
}

/**
 * Convenience mock for unfunded (0 balance) Stellar accounts.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarApisZeroBalance(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return mockStellarApis(mockServer, { unfunded: true });
}

/**
 * Convenience mock for funded XLM + active USDC trustline.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarApisWithActiveUsdcTrustline(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return mockStellarApis(mockServer, {
    xlmBalance: XLM_BALANCE,
    usdc: {
      balance: '25.0000000',
      limit: '922337203685.4775807',
    },
  });
}

/**
 * Convenience mock for funded XLM + inactive USDC trustline (`limit` 0).
 *
 * @param mockServer - Mockttp server.
 */
export async function mockStellarApisWithInactiveUsdcTrustline(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return mockStellarApis(mockServer, {
    xlmBalance: XLM_BALANCE,
    usdc: {
      balance: '0.0000000',
      limit: '0.0000000',
    },
  });
}
/* eslint-enable @typescript-eslint/naming-convention */
