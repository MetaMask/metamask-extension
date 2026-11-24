import { type Json } from '@metamask/utils';
import { Mockttp } from 'mockttp';
import { getProductionRemoteFlagApiResponse } from '../../../feature-flags/feature-flag-registry';

const ACCOUNTS_API = 'https://accounts.api.cx.metamask.io';
const PRICE_API = 'https://price.api.cx.metamask.io';
const FLAGS_API = 'https://client-config.api.cx.metamask.io/v1/flags';

const MAINNET_ASSET_ID = 'eip155:1/slip44:60';
const POLYGON_ASSET_ID = 'eip155:137/slip44:60';

export const STALE_FIXTURE_BALANCE = '1';
export const LOCALHOST_RPC_BALANCE = '7';
/** Not 25: that is both the Accounts API default and the account-tracker seed. */
export const PRICE_API_MAINNET_BALANCE = '6';
export const ACCOUNTS_API_MAINNET_BALANCE = '8';
export const POLYGON_RPC_BALANCE = '3';

const ACCOUNTS_API_POLYGON_BALANCE = '99';

type RpcCall = {
  id?: string | number;
  method?: string;
};

/**
 * Whole-token amount as a 0x-prefixed wei hex string.
 *
 * @param wholeTokens - Token amount in whole units (18 decimals).
 * @returns Wei quantity.
 */
export function weiHex(wholeTokens: bigint): `0x${string}` {
  return `0x${(wholeTokens * 10n ** 18n).toString(16)}`;
}

function rpcResult(
  method: string | undefined,
  chainIdHex: string,
  balanceHex: string,
): unknown {
  switch (method) {
    case 'eth_chainId':
      return chainIdHex;
    case 'net_version':
      return String(parseInt(chainIdHex, 16));
    case 'eth_getBalance':
      return balanceHex;
    case 'eth_blockNumber':
      return '0x1';
    case 'eth_getBlockByNumber':
      return {
        number: '0x1',
        timestamp: '0x65f00000',
        baseFeePerGas: '0x1',
        gasLimit: '0x1c9c380',
        hash: `0x${'11'.repeat(32)}`,
        parentHash: `0x${'00'.repeat(32)}`,
        transactions: [],
      };
    case 'eth_syncing':
      return false;
    case 'eth_getTransactionCount':
      return '0x0';
    case 'eth_call':
    case 'eth_getCode':
      return '0x';
    default:
      return '0x0';
  }
}

/**
 * Answer Infura JSON-RPC, including batched bodies, with a fixed native balance.
 *
 * @param mockServer - Mockttp server.
 * @param urlPattern - RPC URL to intercept.
 * @param chainIdHex - Hex chain id to return from eth_chainId.
 * @param balanceHex - eth_getBalance result.
 */
async function mockJsonRpc(
  mockServer: Mockttp,
  urlPattern: RegExp,
  chainIdHex: string,
  balanceHex: string,
) {
  return mockServer
    .forPost(urlPattern)
    .always()
    .thenCallback(async (request) => {
      const body = (await request.body.getJson()) as RpcCall | RpcCall[];
      const reply = (call: RpcCall) => ({
        jsonrpc: '2.0',
        id: call.id ?? 1,
        result: rpcResult(call.method, chainIdHex, balanceHex),
      });
      return {
        statusCode: 200,
        json: Array.isArray(body) ? body.map(reply) : reply(body ?? {}),
      };
    });
}

/**
 * Production flags, with Accounts API v6 forced on.
 *
 * The published flag is a threshold bucket. E2E has no profile id, so that
 * bucket stays unresolved and the controller treats v6 as off. A boolean is
 * what `AssetsController` checks.
 *
 * @returns Client-config `/v1/flags` body.
 */
function flagsWithAccountsApiV6(): Json[] {
  const overridden = new Set([
    'assetsAccountsApiV6',
    'backendWebSocketConnection',
  ]);
  const retained = getProductionRemoteFlagApiResponse().filter(
    (entry) =>
      !Object.keys(entry as Record<string, Json>).some((name) =>
        overridden.has(name),
      ),
  );
  return [
    ...retained,
    { backendWebSocketConnection: true },
    { assetsAccountsApiV6: true },
  ];
}

function readAccountIds(requestUrl: string): string[] {
  return (new URL(requestUrl).searchParams.get('accountIds') ?? '')
    .split(',')
    .map((accountId) => accountId.trim())
    .filter(Boolean);
}

/**
 * v6 balances body: mainnet is processed, Polygon is listed as unprocessed
 * and also given a balance the UI must ignore.
 *
 * @param requestUrl - Balances request URL.
 * @returns Accounts API v6 JSON.
 */
function partialBalancesJson(requestUrl: string) {
  const balances: {
    accountId: string;
    assetId: string;
    balance: string;
    object: 'token';
  }[] = [];
  const unprocessedNetworks: string[] = [];

  for (const accountId of readAccountIds(requestUrl)) {
    if (accountId.startsWith('eip155:1:')) {
      balances.push({
        accountId,
        assetId: MAINNET_ASSET_ID,
        balance: ACCOUNTS_API_MAINNET_BALANCE,
        object: 'token',
      });
    }
    if (accountId.startsWith('eip155:137:')) {
      balances.push({
        accountId,
        assetId: POLYGON_ASSET_ID,
        balance: ACCOUNTS_API_POLYGON_BALANCE,
        object: 'token',
      });
      unprocessedNetworks.push('eip155:137');
    }
  }

  return {
    count: balances.length,
    balances,
    unprocessedNetworks,
    unprocessedIncludeAssetIds: [],
  };
}

/**
 * Accounts API supports localhost and both balances endpoints return 500.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockAccountsApiDown(mockServer: Mockttp) {
  const failBalances = () => ({ statusCode: 500, json: {} });

  return [
    await mockServer
      .forGet(`${ACCOUNTS_API}/v5/multiaccount/balances`)
      .always()
      .thenCallback(failBalances),
    await mockServer
      .forGet(`${ACCOUNTS_API}/v6/multiaccount/balances`)
      .always()
      .thenCallback(failBalances),
    await mockServer
      .forGet(`${ACCOUNTS_API}/v2/supportedNetworks`)
      .always()
      .thenJson(200, {
        fullSupport: ['eip155:1337'],
        partialSupport: [],
      }),
  ];
}

/**
 * Spot prices and exchange rates return 500. Mainnet RPC balance is 0 so a
 * dropped Accounts API balance cannot be mistaken for the price fallback.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockPriceApiDown(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(`${PRICE_API}/v3/spot-prices`)
      .always()
      .thenCallback(() => ({ statusCode: 500, json: {} })),
    await mockServer
      .forGet(`${PRICE_API}/v1/exchange-rates`)
      .always()
      .thenCallback(() => ({ statusCode: 500, json: {} })),
    await mockJsonRpc(
      mockServer,
      /^https:\/\/mainnet\.infura\.io\/v3\//u,
      '0x1',
      weiHex(0n),
    ),
  ];
}

/**
 * Mainnet is processed. Polygon is unprocessed, and its RPC balance differs
 * from the balance included in the Accounts API body.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockUnprocessedChainBalances(mockServer: Mockttp) {
  const balances = (version: 'v5' | 'v6') =>
    mockServer
      .forGet(`${ACCOUNTS_API}/${version}/multiaccount/balances`)
      .always()
      .thenCallback((request) => ({
        statusCode: 200,
        json: partialBalancesJson(request.url),
      }));

  return [
    await mockServer
      .forGet(FLAGS_API)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: flagsWithAccountsApiV6(),
      })),
    await mockServer
      .forGet(`${ACCOUNTS_API}/v2/supportedNetworks`)
      .always()
      .thenJson(200, {
        fullSupport: ['eip155:1', 'eip155:137'],
        partialSupport: [],
      }),
    await balances('v5'),
    await balances('v6'),
    await mockJsonRpc(
      mockServer,
      /^https:\/\/mainnet\.infura\.io\/v3\//u,
      '0x1',
      weiHex(0n),
    ),
    await mockJsonRpc(
      mockServer,
      /^https:\/\/polygon-mainnet\.infura\.io\/v3\//u,
      '0x89',
      weiHex(BigInt(POLYGON_RPC_BALANCE)),
    ),
    await mockJsonRpc(
      mockServer,
      /^https:\/\/powerful-radial-aura\.matic\.quiknode\.pro\//u,
      '0x89',
      weiHex(BigInt(POLYGON_RPC_BALANCE)),
    ),
  ];
}
