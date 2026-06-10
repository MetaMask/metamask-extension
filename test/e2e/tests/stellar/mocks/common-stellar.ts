/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp, MockedEndpoint } from 'mockttp';
import {
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../../btc/mocks/tokens-api';
import {
  FEATURE_FLAGS_URL,
  mockStellarFeatureFlags,
} from './feature-flag';

// Deterministic Stellar address for the default E2E SRP (group index 0).
export const STELLAR_ACCOUNT_ADDRESS =
  'GDEM2RN4QLPSSPGSPSKSEQ3XXFGM4X4BRH4X4EOPABHAXBVV6OQ6YE6K';
// Must be a valid strkey address (checksum), not just regex-valid.
export const STELLAR_RECIPIENT_ADDRESS =
  'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
export const STELLAR_CHAIN_ID = 'stellar:pubnet';
export const STELLAR_NATIVE_ASSET_ID = `${STELLAR_CHAIN_ID}/slip44:148`;

// XLM balance in stroops (7 decimal places)
export const XLM_BALANCE = 60723920; // ~6.0723920 XLM
export const XLM_TO_USD_RATE = 0.12;
export const STROOPS_PER_XLM = 10_000_000;

export { FEATURE_FLAGS_URL } from './feature-flag';

const HORIZON_MAINNET_BASE = 'https://horizon\\.stellar\\.org';
const HORIZON_TESTNET_BASE = 'https://horizon-testnet\\.stellar\\.org';
const SECURITY_ALERTS_API_URL = 'https://security-alerts.api.cx.metamask.io';

function horizonMainnetUrl(path: string): RegExp {
  return new RegExp(`^${HORIZON_MAINNET_BASE}${path}$`, 'u');
}

function horizonTestnetUrl(path: string): RegExp {
  return new RegExp(`^${HORIZON_TESTNET_BASE}${path}$`, 'u');
}

function formatHorizonNativeBalance(balanceStroops: number): string {
  return (balanceStroops / STROOPS_PER_XLM).toFixed(7);
}

function buildHorizonAccountResponse(
  balanceStroops: number,
  accountId: string,
) {
  return {
    id: accountId,
    account_id: accountId,
    sequence: '123456789',
    subentry_count: 0,
    balances: [
      {
        balance: formatHorizonNativeBalance(balanceStroops),
        buying_liabilities: '0',
        selling_liabilities: '0',
        asset_type: 'native',
      },
    ],
    signers: [
      {
        weight: 1,
        key: accountId,
        type: 'ed25519_public_key',
      },
    ],
    flags: {
      auth_required: false,
      auth_revocable: false,
      auth_immutable: false,
      auth_clawback_enabled: false,
    },
    thresholds: {
      low_threshold: 0,
      med_threshold: 0,
      high_threshold: 0,
    },
  };
}

export async function mockHorizonAccount(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint> {
  const balance = mockZeroBalance ? 0 : XLM_BALANCE;

  const respondToAccountRequest = (request: { url: string }) => {
    const match = request.url.match(/\/accounts\/(G[A-Z2-7]{55})/u);
    const accountId = match?.[1] ?? STELLAR_ACCOUNT_ADDRESS;
    const accountBalance =
      accountId === STELLAR_RECIPIENT_ADDRESS ? STROOPS_PER_XLM : balance;

    return {
      statusCode: 200,
      json: buildHorizonAccountResponse(accountBalance, accountId),
    };
  };

  await mockServer
    .forGet(horizonMainnetUrl(`/accounts/${STELLAR_ACCOUNT_ADDRESS}($|\\?)`))
    .always()
    .thenCallback(respondToAccountRequest);

  await mockServer
    .forGet(horizonMainnetUrl(`/accounts/${STELLAR_RECIPIENT_ADDRESS}($|\\?)`))
    .always()
    .thenCallback(respondToAccountRequest);

  await mockServer
    .forGet(horizonTestnetUrl(`/accounts/${STELLAR_ACCOUNT_ADDRESS}($|\\?)`))
    .always()
    .thenCallback(respondToAccountRequest);

  await mockServer
    .forGet(horizonTestnetUrl(`/accounts/${STELLAR_RECIPIENT_ADDRESS}($|\\?)`))
    .always()
    .thenCallback(respondToAccountRequest);

  await mockServer
    .forGet(horizonTestnetUrl('/accounts/G[A-Z2-7]{55}($|\\?)'))
    .always()
    .thenCallback(respondToAccountRequest);

  return mockServer
    .forGet(horizonMainnetUrl('/accounts/G[A-Z2-7]{55}($|\\?)'))
    .always()
    .thenCallback(respondToAccountRequest);
}

export async function mockHorizonLedgers(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(horizonMainnetUrl('/ledgers($|\\?)'))
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        _embedded: {
          records: [
            {
              id: '12345',
              paging_token: '12345',
              sequence: '123456790',
            },
          ],
        },
      },
    }));
}

export async function mockHorizonTransactions(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      horizonMainnetUrl(
        `/accounts/${STELLAR_ACCOUNT_ADDRESS}/transactions($|\\?)`,
      ),
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        _embedded: {
          records: [
            {
              id: 'stellar-tx-mock-1',
              hash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
              successful: true,
              created_at: '2025-01-01T00:00:00Z',
            },
          ],
        },
      },
    }));
}

export async function mockHorizonPayments(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      horizonMainnetUrl(`/accounts/${STELLAR_ACCOUNT_ADDRESS}/payments($|\\?)`),
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        _embedded: {
          records: [],
        },
      },
    }));
}

function buildHorizonFeeStatsResponse() {
  return {
    last_ledger: '12345',
    last_ledger_base_fee: '100',
    ledger_capacity_usage: '0.5',
    fee_charged: {
      max: '100',
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
      p90: '100',
      p95: '100',
      p99: '100',
    },
    max_fee: {
      max: '100',
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
      p90: '100',
      p95: '100',
      p99: '100',
    },
  };
}

export async function mockHorizonFeeStats(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  const endpoints = [
    horizonMainnetUrl('/fee_stats'),
    horizonTestnetUrl('/fee_stats'),
  ];

  const mock = await mockServer
    .forGet(endpoints[0])
    .thenCallback(() => ({
      statusCode: 200,
      json: buildHorizonFeeStatsResponse(),
    }));

  await mockServer.forGet(endpoints[1]).thenCallback(() => ({
    statusCode: 200,
    json: buildHorizonFeeStatsResponse(),
  }));

  return mock;
}

const STELLAR_SECURITY_SCAN_RESPONSE = {
  simulation: {
    status: 'Success',
    account_summary: {
      account_assets_diffs: [],
    },
  },
  validation: {
    status: 'Success',
    result_type: 'Benign',
  },
};

export async function mockStellarSecurityAlertsScan(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  await mockServer
    .forPost(`${SECURITY_ALERTS_API_URL}/stellar/transaction/scan`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: STELLAR_SECURITY_SCAN_RESPONSE,
    }));

  return mockServer
    .forPost(/https:\/\/security-alerts\.api\.cx\.metamask\.io\/stellar\/transaction\/scan/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: STELLAR_SECURITY_SCAN_RESPONSE,
    }));
}

export async function mockStellarSpotPrices(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        [STELLAR_NATIVE_ASSET_ID]: {
          id: 'stellar',
          price: XLM_TO_USD_RATE,
          marketCap: 3000000000,
          allTimeHigh: 0.94,
          allTimeLow: 0.002,
          totalVolume: 100000000,
          high1d: 0.13,
          low1d: 0.11,
          circulatingSupply: 30000000000,
          dilutedMarketCap: 3000000000,
          marketCapPercentChange1d: 0,
          priceChange1d: 0,
          pricePercentChange1h: 0,
          pricePercentChange1d: 0,
          pricePercentChange7d: 0,
          pricePercentChange14d: 0,
          pricePercentChange30d: 0,
          pricePercentChange200d: 0,
          pricePercentChange1y: 0,
        },
      },
    }));
}

export async function mockStellarExchangeRates(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .withQuery({ baseCurrency: 'usd' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
        xlm: {
          name: 'Stellar',
          ticker: 'xlm',
          value: 8.33,
          currencyType: 'crypto',
        },
      },
    }));
}

export async function mockStellarFiatExchangeRates(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates/fiat')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
        eur: {
          name: 'Euro',
          ticker: 'eur',
          value: 0.858193994158645,
          currencyType: 'fiat',
        },
      },
    }));
}

export async function mockStellarHistoricalPrices(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v\d+\/historical-prices/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        [STELLAR_NATIVE_ASSET_ID]: {
          prices: [[Date.now(), XLM_TO_USD_RATE]],
        },
      },
    }));
}

export async function mockAccountsApiV2WithStellar(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        fullSupport: [
          1,
          137,
          56,
          59144,
          8453,
          10,
          42161,
          534352,
          1337,
          STELLAR_CHAIN_ID,
        ],
        partialSupport: { balances: [] },
      },
    }));
}

export async function mockAccountsApiV5WithStellar(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint> {
  const xlmAmount = mockZeroBalance
    ? '0'
    : String(XLM_BALANCE / STROOPS_PER_XLM);
  const balances = [
    {
      accountId: `${STELLAR_CHAIN_ID}:${STELLAR_ACCOUNT_ADDRESS}`,
      assetId: STELLAR_NATIVE_ASSET_ID,
      balance: xlmAmount,
    },
  ];

  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: balances.length,
        unprocessedNetworks: [],
        balances,
      },
    }));
}

export async function mockStellarSubmitTransaction(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(horizonMainnetUrl('/transactions'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        hash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
        successful: true,
      },
    }));
}

export async function mockStellarSorobanRpc(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  const txHash =
    'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890';

  return mockServer
    .forPost('https://mainnet.sorobanrpc.com')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          status: 'SUCCESS',
          txHash,
          hash: txHash,
        },
      },
    }));
}

export async function mockStellarApis(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint[]> {
  return [
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
    await mockAccountsApiV2WithStellar(mockServer),
    await mockAccountsApiV5WithStellar(mockServer, mockZeroBalance),
    ...(await mockStellarFeatureFlags(mockServer)),
    await mockHorizonAccount(mockServer, mockZeroBalance),
    await mockHorizonLedgers(mockServer),
    await mockHorizonTransactions(mockServer),
    await mockHorizonPayments(mockServer),
    await mockHorizonFeeStats(mockServer),
    await mockStellarSpotPrices(mockServer),
    await mockStellarExchangeRates(mockServer),
    await mockStellarFiatExchangeRates(mockServer),
    await mockStellarHistoricalPrices(mockServer),
    await mockStellarSubmitTransaction(mockServer),
    await mockStellarSorobanRpc(mockServer),
    await mockStellarSecurityAlertsScan(mockServer),
  ];
}
