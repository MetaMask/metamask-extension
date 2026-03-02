/**
 * Performance benchmark mock server configuration.
 *
 * All response payloads live in mock-responses.ts and JSON fixture files.
 */
import { Mockttp, MockedEndpoint, RequestRuleBuilder } from 'mockttp';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import { POWER_USER_PRICES } from './price-data';
import { buildSseResponseBody } from './swap-mocks';
import bridgeNetworkTokens from './bridge-network-tokens.json';
import bridgeTokens from './bridge-tokens.json';
import bridgeTokensPopular from './bridge-tokens-popular.json';
import bridgeTokensSearch from './bridge-tokens-search.json';
import chainsList from './chains-list.json';
import swapQuoteEthUsdc from './swap-quote-eth-usdc.json';
import swapQuoteSolUsdc from './swap-quote-sol-usdc.json';
import {
  jsonRpcResponse,
  buildSpotPricesResponse,
  buildHistoricalPricesResponse,
  buildCryptocomparePrice,
  FIAT_EXCHANGE_RATES,
  CRYPTO_EXCHANGE_RATES,
  SUPPORTED_VS_CURRENCIES,
  SUPPORTED_NETWORKS,
  BITCOIN_SPOT_PRICES,
  SOLANA_SPOT_PRICES,
  CRYPTOCOMPARE_MULTI_PRICES,
  PHISHING_DETECTION,
  SUBSCRIPTION_ELIGIBILITY,
  BRIDGE_FEATURE_FLAGS,
  CLIENT_CONFIG_FLAGS,
  SECURITY_ALERTS,
  SUGGESTED_GAS_FEES,
  GAS_PRICES,
  TOP_ASSETS,
  AGGREGATOR_METADATA,
  ACCOUNTS_TRANSACTIONS,
  ACCOUNTS_BALANCES,
  solanaGetBalanceResponse,
  solanaGetAccountInfoResponse,
  SOLANA_GET_LATEST_BLOCKHASH,
  SOLANA_GET_FEE_FOR_MESSAGE,
  SOLANA_GET_MIN_BALANCE_RENT_EXEMPTION,
  SOLANA_GET_TOKEN_ACCOUNTS_BY_OWNER,
  SOLANA_SIMULATE_TRANSACTION,
  SOLANA_GET_SIGNATURES_FOR_ADDRESS,
  solanaCatchAllResponse,
} from './mock-responses';

const AuthMocks = AuthenticationController.Mocks;

/**
 * Mock Priority System for Performance Tests
 *
 * mockttp evaluates mocks by priority (higher = checked first).
 * The catch-all in mock-e2e.js (forAnyRequest) returns empty 200 for unhandled URLs,
 * so specific mocks need higher priority to be evaluated first.
 */
export const MOCK_PRIORITIES = {
  STANDARD: 100,
  CHAIN_SPECIFIC: 200,
  CHAIN_SPECIFIC_CATCHALL: 199,
  TEST_OVERRIDE: 300,
  TEST_OVERRIDE_CATCHALL: 299,
  HIGH_PRIORITY: 500,
} as const;

export type MockPriorityLevel = keyof typeof MOCK_PRIORITIES;

/**
 * Wraps a static response with a simulated network delay.
 * Delay values are based on Sentry production traces.
 *
 * @param delayMs
 * @param response
 */
function delayedResponse<TResponse>(
  delayMs: number,
  response: TResponse,
): (req: { url: string }) => Promise<TResponse> {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return response;
  };
}

function delayedCallback<TResponse>(
  delayMs: number,
  callback: (req: { url: string }) => TResponse,
): (req: { url: string }) => Promise<TResponse> {
  return async (req) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return callback(req);
  };
}

type AuthMockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

async function mockAuthAPICall(
  server: Mockttp,
  mockResponse: AuthMockResponse,
  delayMs = 0,
): Promise<MockedEndpoint> {
  let requestRuleBuilder: RequestRuleBuilder | undefined;

  if (mockResponse.requestMethod === 'GET') {
    requestRuleBuilder = server.forGet(mockResponse.url);
  } else if (mockResponse.requestMethod === 'POST') {
    requestRuleBuilder = server.forPost(mockResponse.url);
  } else if (mockResponse.requestMethod === 'PUT') {
    requestRuleBuilder = server.forPut(mockResponse.url);
  } else if (mockResponse.requestMethod === 'DELETE') {
    requestRuleBuilder = server.forDelete(mockResponse.url);
  }

  if (!requestRuleBuilder) {
    throw new Error(
      `Unsupported request method: ${mockResponse.requestMethod}`,
    );
  }

  return requestRuleBuilder
    .asPriority(150)
    .always()
    .thenCallback(async (request) => {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const { path, body } = request;
      const [requestBodyJson, requestBodyText] = await Promise.all([
        body.getJson().catch(() => undefined),
        body.getText().catch(() => ''),
      ]);
      const requestBody = requestBodyJson ?? requestBodyText;

      const json = (
        mockResponse.response as (
          requestBody: object | string | undefined,
          path: string,
          getE2ESrpIdentifierForPublicKey: (
            publicKey: string,
          ) => string | undefined,
        ) => unknown
      )(requestBody, path, () => 'MOCK_SRP_IDENTIFIER_1');

      return {
        statusCode: 200,
        json,
      };
    });
}

const MOCK_JWT =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNzA2MTEzMDYyLCJleHAiOjE5NjkxODUwNjN9.dGVzdA';
const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyfQ.dGVzdA';

/**
 * Hostname/URL patterns that must be intercepted in pass-through mode.
 * Standard mockttp rules don't reliably catch all proxied requests in MV3
 * (service worker can bypass --proxy-server), so the benchmarkPassThroughInterceptor
 * acts as a safety net inside the catch-all thenPassThrough({ beforeRequest }).
 */
const INTERCEPTED_PATTERNS: {
  match: (url: string, method: string) => boolean;
  response: Record<string, unknown>;
}[] = [
  {
    match: (url) => /^https:\/\/sentry\.io\/api/u.test(url),
    response: { statusCode: 200, json: { success: true } },
  },
  {
    match: (url) => /^https:\/\/api\.segment\.io\/v1\//u.test(url),
    response: { statusCode: 200, json: {} },
  },
  {
    match: (url) => url.includes('chainid.network/chains.json'),
    response: { statusCode: 200, json: chainsList },
  },
  {
    match: (url) => url.includes('subscription') && url.includes('eligibility'),
    response: {
      statusCode: 200,
      json: [
        {
          canSubscribe: true,
          canViewEntryModal: true,
          minBalanceUSD: 1000,
          product: 'shield',
        },
      ],
    },
  },
  {
    match: (url) =>
      /subscription\.(dev-)?api\.cx\.metamask\.io\/v1\/subscriptions$/u.test(
        url,
      ),
    response: {
      statusCode: 200,
      json: { subscriptions: [], trialedProducts: [] },
    },
  },
  {
    match: (url) => url.includes('bitcoin-mainnet.infura.io'),
    response: { statusCode: 200, json: [] },
  },
  {
    match: (url) => url.includes('tron-mainnet.infura.io'),
    response: { statusCode: 200, json: {} },
  },
  /* eslint-disable @typescript-eslint/naming-convention */
  {
    match: (url) =>
      url.includes('authentication.api.cx.metamask.io') &&
      url.includes('/nonce'),
    response: {
      statusCode: 200,
      json: {
        nonce: 'mock-nonce-for-benchmark',
        identifier: '0x0000000000000000000000000000000000000000',
        expires_in: 300,
      },
    },
  },
  {
    match: (url, method) =>
      url.includes('authentication.api.cx.metamask.io') &&
      url.includes('/srp/login') &&
      method === 'POST',
    response: {
      statusCode: 200,
      json: {
        token: MOCK_JWT,
        expires_in: 3600,
        profile: {
          profile_id: 'mock-profile-id',
          metametrics_id: 'mock-metametrics-id',
          identifier_id: 'mock-identifier-id',
          identifier_type: 'SRP',
          encrypted_storage_key: 'mock-storage-key',
        },
      },
    },
  },
  {
    match: (url) => url.includes('oidc.api.cx.metamask.io'),
    response: {
      statusCode: 200,
      json: {
        access_token: MOCK_ACCESS_TOKEN,
        expires_in: 3600,
      },
    },
  },
  {
    match: (url) =>
      url.includes('authentication.api.cx.metamask.io') &&
      url.includes('/profile/lineage'),
    response: {
      statusCode: 200,
      json: {
        lineage: [
          {
            agent: 'extension',
            metametrics_id: 'mock-metametrics-id',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      },
    },
  },
  /* eslint-enable @typescript-eslint/naming-convention */
  {
    match: (url) =>
      url.includes('authentication.api.cx.metamask.io') &&
      url.includes('/profile/accounts'),
    response: { statusCode: 200, json: [] },
  },
  {
    match: (url) => url.includes('authentication.api.cx.metamask.io'),
    response: { statusCode: 200, json: {} },
  },
  {
    match: (url) => url.includes('user-storage.api.cx.metamask.io'),
    response: { statusCode: 200, json: null },
  },
  {
    match: (url) => url.includes('accounts.api.cx.metamask.io'),
    response: { statusCode: 200, json: [] },
  },
  {
    match: (url) =>
      url.includes('acl.execution.metamask.io') &&
      url.includes('registry.json'),
    response: { statusCode: 200, json: { registry: {} } },
  },
  {
    match: (url) =>
      url.includes('acl.execution.metamask.io') &&
      url.includes('signature.json'),
    response: { statusCode: 200, json: { signature: 'mock-signature' } },
  },
];

/**
 * Pass-through interceptor safety net. Evaluated inside the catch-all
 * thenPassThrough({ beforeRequest }) to intercept requests that bypass
 * standard mockttp rules in MV3 proxy mode.
 *
 * @param req - The incoming request with url and method.
 * @param req.url - The request URL.
 * @param req.method - The HTTP method.
 * @returns A mock response object if matched, or null to pass through.
 */
export function benchmarkPassThroughInterceptor(req: {
  url: string;
  method: string;
}): { response: Record<string, unknown> } | null {
  for (const pattern of INTERCEPTED_PATTERNS) {
    if (pattern.match(req.url, req.method)) {
      return { response: pattern.response };
    }
  }
  return null;
}

/**
 * Common mocks for pass-through mode.
 * Returns standard mockttp rules for analytics and other noisy endpoints.
 * All rules use .always() so they match every request (not just the first).
 *
 * @param server - The mockttp server instance.
 * @returns Array of mocked endpoint promises.
 */
export function getCommonMocks(server: Mockttp): Promise<MockedEndpoint>[] {
  return [
    server
      .forGet('https://chainid.network/chains.json')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: chainsList };
      }),
    server
      .forPost(/^https:\/\/sentry\.io\/api/u)
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: { success: true } };
      }),
    server
      .forPost(/^https:\/\/api\.segment\.io\/v1\//u)
      .always()
      .thenCallback(() => {
        return { statusCode: 200 };
      }),
    server
      .forGet(
        /^https:\/\/subscription\.(dev-)?api\.cx\.metamask\.io\/v1\/subscriptions\/eligibility/u,
      )
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              canSubscribe: true,
              canViewEntryModal: true,
              minBalanceUSD: 1000,
              product: 'shield',
            },
          ],
        };
      }),
    server
      .forGet(
        /^https:\/\/subscription\.(dev-)?api\.cx\.metamask\.io\/v1\/subscriptions$/u,
      )
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: { subscriptions: [], trialedProducts: [] },
        };
      }),
    server
      .forAnyRequest()
      .forHost('bitcoin-mainnet.infura.io')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: [] };
      }),
    server
      .forAnyRequest()
      .forHost('tron-mainnet.infura.io')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: {} };
      }),
    /* eslint-disable @typescript-eslint/naming-convention */
    server
      .forGet(
        /^https:\/\/authentication\.api\.cx\.metamask\.io\/api\/v2\/nonce/u,
      )
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            nonce: 'mock-nonce-for-benchmark',
            identifier: '0x0000000000000000000000000000000000000000',
            expires_in: 300,
          },
        };
      }),
    server
      .forPost(
        /^https:\/\/authentication\.api\.cx\.metamask\.io\/api\/v2\/srp\/login/u,
      )
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            token: MOCK_JWT,
            expires_in: 3600,
            profile: {
              profile_id: 'mock-profile-id',
              metametrics_id: 'mock-metametrics-id',
              identifier_id: 'mock-identifier-id',
              identifier_type: 'SRP',
              encrypted_storage_key: 'mock-storage-key',
            },
          },
        };
      }),
    server
      .forPost(/^https:\/\/oidc\.api\.cx\.metamask\.io\/oauth2\/token/u)
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            access_token: MOCK_ACCESS_TOKEN,
            expires_in: 3600,
          },
        };
      }),
    server
      .forGet(
        /^https:\/\/authentication\.api\.cx\.metamask\.io\/api\/v2\/profile\/lineage/u,
      )
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            lineage: [
              {
                agent: 'extension',
                metametrics_id: 'mock-metametrics-id',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
              },
            ],
          },
        };
      }),
    /* eslint-enable @typescript-eslint/naming-convention */
    server
      .forGet(
        /^https:\/\/authentication\.api\.cx\.metamask\.io\/api\/v2\/profile\/accounts/u,
      )
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: [] };
      }),
    server
      .forAnyRequest()
      .forHost('authentication.api.cx.metamask.io')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: {} };
      }),
    server
      .forGet(/^https:\/\/user-storage\.api\.cx\.metamask\.io/u)
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: null };
      }),
    server
      .forPut(/^https:\/\/user-storage\.api\.cx\.metamask\.io/u)
      .always()
      .thenCallback(() => {
        return { statusCode: 204 };
      }),
    server
      .forDelete(/^https:\/\/user-storage\.api\.cx\.metamask\.io/u)
      .always()
      .thenCallback(() => {
        return { statusCode: 204 };
      }),
    server
      .forAnyRequest()
      .forHost('user-storage.api.cx.metamask.io')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: null };
      }),
    server
      .forAnyRequest()
      .forHost('accounts.api.cx.metamask.io')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: [] };
      }),
    server
      .forGet('https://acl.execution.metamask.io/latest/registry.json')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: { registry: {} } };
      }),
    server
      .forGet('https://acl.execution.metamask.io/latest/signature.json')
      .always()
      .thenCallback(() => {
        return { statusCode: 200, json: { signature: 'mock-signature' } };
      }),
  ];
}

const SOLANA_URL_REGEX = /^https:\/\/solana-mainnet\.infura\.io\/v3\/.*/u;

export async function mockBenchmarkEndpoints(
  server: Mockttp,
): Promise<MockedEndpoint[]> {
  const endpoints: MockedEndpoint[] = [];

  endpoints.push(
    await server
      .forPost(/sentry\.io/u)
      .asPriority(150)
      .always()
      .thenCallback(
        delayedResponse(100, { statusCode: 200, json: { success: true } }),
      ),
  );

  endpoints.push(
    await server
      .forPost(/segment\.io/u)
      .asPriority(150)
      .always()
      .thenCallback(delayedResponse(100, { statusCode: 200 })),
  );

  endpoints.push(
    await server
      .forGet(/token\.api\.cx\.metamask\.io\/tokens/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(800, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await server
      .forGet(/defiadapters\.api\.cx\.metamask\.io\/positions/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1000, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await server
      .forGet(/on-ramp-content\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(1200, { statusCode: 200, json: { networks: [] } }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/accounts\.api\.cx\.metamask\.io\/v1\/users\/.*\/surveys/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(7000, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await server
      .forGet(/chainid\.network\/chains\.json/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(1200, { statusCode: 200, json: chainsList }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/phishing-detection\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(5000, PHISHING_DETECTION)),
  );

  endpoints.push(
    await server
      .forGet(/client-side-detection\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(6000, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await mockAuthAPICall(server, AuthMocks.getMockAuthNonceResponse(), 1200),
  );
  endpoints.push(
    await mockAuthAPICall(server, AuthMocks.getMockAuthLoginResponse(), 1200),
  );
  endpoints.push(
    await mockAuthAPICall(
      server,
      AuthMocks.getMockAuthAccessTokenResponse(),
      3400,
    ),
  );

  endpoints.push(
    await server
      .forGet(/user-storage\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, { statusCode: 200, json: null })),
  );

  endpoints.push(
    await server
      .forPut(/user-storage\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, { statusCode: 204, json: null })),
  );

  endpoints.push(
    await server
      .forGet(
        /subscription\.(api|dev-api)\.cx\.metamask\.io\/v1\/subscriptions$/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(3000, {
          statusCode: 200,
          json: { subscriptions: [], trialedProducts: [] },
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet(
        /subscription\.(api|dev-api)\.cx\.metamask\.io\/v1\/subscriptions\/eligibility/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(3000, SUBSCRIPTION_ELIGIBILITY)),
  );

  endpoints.push(
    await server
      .forPost(/^https:\/\/mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1800, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/polygon-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1400, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/bsc-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/optimism-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/arbitrum-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/base-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1300, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/linea-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1300, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/avalanche-mainnet\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(900, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/sepolia\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/linea-sepolia\.infura\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/https:\/\/celo-mainnet\.infura\.io\/v3\/.*/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost('https://rpc.gnosischain.com/')
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1500, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/mainnet\.era\.zksync\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(900, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/carrot\.megaeth\.com/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(100, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forPost(/testnet-rpc\.monad\.xyz/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(100, jsonRpcResponse('0x0'))),
  );

  endpoints.push(
    await server
      .forAnyRequest()
      .forHost('accounts.google.com')
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(100, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await server
      .forGet(/metamask\.github\.io\/ledger-iframe-bridge/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(100, {
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: '<!DOCTYPE html><html><body></body></html>',
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/tx-sentinel.*\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(100, { statusCode: 200, json: { networks: [] } }),
      ),
  );

  endpoints.push(
    await server
      .forAnyRequest()
      .forHost('trigger.api.cx.metamask.io')
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(100, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await server
      .forAnyRequest()
      .forHost('notification.api.cx.metamask.io')
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(100, { statusCode: 200, json: { notifications: [] } }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/cdn\.contentful\.com/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(100, { statusCode: 200, json: { items: [] } }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/static\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(200, {
          statusCode: 200,
          headers: { 'Content-Type': 'image/png' },
          body: Buffer.from([]),
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet('https://acl.execution.metamask.io/latest/registry.json')
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(500, { statusCode: 200, json: { registry: {} } }),
      ),
  );

  endpoints.push(
    await server
      .forGet('https://acl.execution.metamask.io/latest/signature.json')
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(500, {
          statusCode: 200,
          json: { signature: 'mock-signature' },
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/portfolio\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(800, {
          statusCode: 200,
          body: '<!DOCTYPE html><html><body>Portfolio</body></html>',
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/supportedVsCurrencies/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, SUPPORTED_VS_CURRENCIES)),
  );

  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/supportedNetworks/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, SUPPORTED_NETWORKS)),
  );

  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(100, FIAT_EXCHANGE_RATES)),
  );

  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates(?:$|\?)/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(100, CRYPTO_EXCHANGE_RATES)),
  );

  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices\/bitcoin/u)
      .asPriority(102)
      .always()
      .thenCallback(delayedResponse(2000, BITCOIN_SPOT_PRICES)),
  );

  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices\/solana/u)
      .asPriority(102)
      .always()
      .thenCallback(delayedResponse(2000, SOLANA_SPOT_PRICES)),
  );

  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices\?.*solana/u)
      .asPriority(103)
      .always()
      .thenCallback(
        delayedCallback(2000, (req) =>
          buildSpotPricesResponse(req.url, POWER_USER_PRICES),
        ),
      ),
  );

  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices/u)
      .asPriority(101)
      .always()
      .thenCallback(
        delayedCallback(2000, (req) =>
          buildSpotPricesResponse(req.url, POWER_USER_PRICES),
        ),
      ),
  );

  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/chains\/.*\/historical-prices/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(600, buildHistoricalPricesResponse())),
  );

  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/networks\/.*\/historical-prices/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(600, buildHistoricalPricesResponse())),
  );

  endpoints.push(
    await server
      .forGet(/^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1300, CRYPTOCOMPARE_MULTI_PRICES)),
  );

  endpoints.push(
    await server
      .forGet(/^https:\/\/min-api\.cryptocompare\.com\/data\/price(?!multi)/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedCallback(1300, (req) => buildCryptocomparePrice(req.url)),
      ),
  );

  endpoints.push(
    await server
      .forGet(
        /accounts\.api\.cx\.metamask\.io\/v1\/accounts\/.*\/transactions/u,
      )
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(5000, ACCOUNTS_TRANSACTIONS)),
  );

  endpoints.push(
    await server
      .forGet(/accounts\.api\.cx\.metamask\.io\/v1\/accounts\/.*\/balances/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(5000, ACCOUNTS_BALANCES)),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getBalance' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(async (req) => {
        const body = (await req.body.getJson()) as { id?: string };
        await new Promise((resolve) => setTimeout(resolve, 100));
        return solanaGetBalanceResponse(body.id || '1337');
      }),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getAccountInfo' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(async (req) => {
        const body = (await req.body.getJson()) as { id?: string };
        await new Promise((resolve) => setTimeout(resolve, 100));
        return solanaGetAccountInfoResponse(body.id || '1337');
      }),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getLatestBlockhash' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(delayedResponse(100, SOLANA_GET_LATEST_BLOCKHASH)),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getFeeForMessage' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(delayedResponse(100, SOLANA_GET_FEE_FOR_MESSAGE)),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getMinimumBalanceForRentExemption' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(
        delayedResponse(100, SOLANA_GET_MIN_BALANCE_RENT_EXEMPTION),
      ),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getTokenAccountsByOwner' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(delayedResponse(100, SOLANA_GET_TOKEN_ACCOUNTS_BY_OWNER)),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'simulateTransaction' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(delayedResponse(100, SOLANA_SIMULATE_TRANSACTION)),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getSignaturesForAddress' })
      .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
      .always()
      .thenCallback(delayedResponse(100, SOLANA_GET_SIGNATURES_FOR_ADDRESS)),
  );

  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE_CATCHALL)
      .always()
      .thenCallback(async (req) => {
        const body = (await req.body.getJson()) as { id?: string };
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return solanaCatchAllResponse(body.id || '1337');
      }),
  );

  endpoints.push(
    await server
      .forPost(/getTokens\/popular/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(300, { statusCode: 200, json: bridgeTokensPopular }),
      ),
  );

  endpoints.push(
    await server
      .forPost(/getTokens\/search/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(300, { statusCode: 200, json: bridgeTokensSearch }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/getTokens/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(300, { statusCode: 200, json: bridgeTokens }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/getQuoteStream/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedCallback(2000, (req) => {
          const isSolana = req.url.includes('srcChainId=1151111081099710');
          const quote = isSolana ? swapQuoteSolUsdc : swapQuoteEthUsdc;
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/event-stream' },
            body: buildSseResponseBody([quote]),
          };
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/getQuote(?!Stream)/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedCallback(2000, (req) => {
          const isSolana = req.url.includes('srcChainId=1151111081099710');
          const quote = isSolana ? swapQuoteSolUsdc : swapQuoteEthUsdc;
          return { statusCode: 200, json: [quote] };
        }),
      ),
  );

  endpoints.push(
    await server
      .forGet(/bridge\.api\.cx\.metamask\.io/u)
      .asPriority(50)
      .always()
      .thenCallback(delayedResponse(500, { statusCode: 200, json: [] })),
  );

  endpoints.push(
    await server
      .forGet(/bridge\.api\.cx\.metamask\.io\/featureFlags/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1500, BRIDGE_FEATURE_FLAGS)),
  );

  endpoints.push(
    await server
      .forGet(/client-config\.api\.cx\.metamask\.io\/v1\/flags/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1000, CLIENT_CONFIG_FLAGS)),
  );

  endpoints.push(
    await server
      .forPost(/https:\/\/security-alerts\.api\.cx\.metamask\.io/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(1000, SECURITY_ALERTS)),
  );

  endpoints.push(
    await server
      .forGet(/gas\.api\.cx\.metamask\.io\/networks\/\d+\/suggestedGasFees/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, SUGGESTED_GAS_FEES)),
  );

  endpoints.push(
    await server
      .forGet(/gas\.api\.cx\.metamask\.io\/networks\/\d+\/gasPrices/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(600, GAS_PRICES)),
  );

  endpoints.push(
    await server
      .forGet(/\/topAssets/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(400, TOP_ASSETS)),
  );

  endpoints.push(
    await server
      .forGet(/\/aggregatorMetadata/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(delayedResponse(500, AGGREGATOR_METADATA)),
  );

  endpoints.push(
    await server
      .forGet(/bridge\.api\.cx\.metamask\.io\/networks\/\d+\/tokens/u)
      .asPriority(MOCK_PRIORITIES.TEST_OVERRIDE)
      .always()
      .thenCallback(
        delayedResponse(300, { statusCode: 200, json: bridgeNetworkTokens }),
      ),
  );

  return endpoints;
}
