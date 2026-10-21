import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { type Json } from '@metamask/utils';
import { NetworkStatus } from '@metamask/network-controller';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags/feature-flag-registry';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  NETWORK_CLIENT_ID,
} from '../../constants';

const ACCOUNTS_API = 'https://accounts.api.cx.metamask.io';
const PRICE_API = 'https://price.api.cx.metamask.io';
const FLAGS_API = 'https://client-config.api.cx.metamask.io/v1/flags';

const LOCALHOST_ASSET_ID = 'eip155:1337/slip44:1';
const MAINNET_ASSET_ID = 'eip155:1/slip44:60';
const POLYGON_ASSET_ID = 'eip155:137/slip44:60';

const STALE_FIXTURE_BALANCE = '1';
const ACCOUNTS_API_MAINNET_BALANCE = '8';
const ACCOUNTS_API_POLYGON_BALANCE = '99';
const POLYGON_RPC_BALANCE = '3';
const LOCALHOST_RPC_BALANCE = '7';
// Not 25: that is both the Accounts API default and the account-tracker seed.
const PRICE_API_MAINNET_BALANCE = '6';

const LIST_TIMEOUT_MS = 30_000;

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
function weiHex(wholeTokens: bigint): `0x${string}` {
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
 * The Accounts API figure is different, so the token row shows which source won.
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
): Promise<MockedEndpoint> {
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

async function assertEndpointWasCalled(
  endpoint: MockedEndpoint | undefined,
  label: string,
): Promise<void> {
  assert.ok(endpoint, `Missing mock endpoint for ${label}`);
  const seen = await endpoint.getSeenRequests();
  assert.ok(
    seen.length > 0,
    `Expected the extension to call ${label}, but that mock saw no requests`,
  );
}

describe('Assets API fallbacks', function (this: Suite) {
  it('shows the RPC balance when the Accounts API returns 500', async function () {
    this.timeout(90_000);
    let accountsBalancesV5: MockedEndpoint | undefined;
    let accountsBalancesV6: MockedEndpoint | undefined;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withAccountTracker({
            accountsByChainId: {
              '0x539': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
            },
          })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                [LOCALHOST_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        // Fund the fixture account before the extension boots. The default
        // Anvil balance belongs to a different address, so an unread RPC
        // would stay at the stale fixture amount.
        afterLocalNodesStart: async ({
          localNodes,
        }: {
          localNodes: Anvil[];
        }) => {
          await localNodes[0].setAccountBalance(
            DEFAULT_FIXTURE_ACCOUNT,
            weiHex(BigInt(LOCALHOST_RPC_BALANCE)),
          );
        },
        testSpecificMock: async (mockServer: Mockttp) => {
          const failBalances = () => ({ statusCode: 500, json: {} });
          accountsBalancesV5 = await mockServer
            .forGet(`${ACCOUNTS_API}/v5/multiaccount/balances`)
            .always()
            .thenCallback(failBalances);
          accountsBalancesV6 = await mockServer
            .forGet(`${ACCOUNTS_API}/v6/multiaccount/balances`)
            .always()
            .thenCallback(failBalances);
          return [
            accountsBalancesV5,
            accountsBalancesV6,
            await mockServer
              .forGet(`${ACCOUNTS_API}/v2/supportedNetworks`)
              .always()
              .thenJson(200, {
                fullSupport: ['eip155:1337'],
                partialSupport: [],
              }),
          ];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const homepage = new HomePage(driver);
        await homepage.checkExpectedBalanceIsDisplayed({
          expectedBalance: LOCALHOST_RPC_BALANCE,
          timeout: LIST_TIMEOUT_MS,
        });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          'Ethereum',
          `${LOCALHOST_RPC_BALANCE} ETH`,
          { timeout: LIST_TIMEOUT_MS, amountTimeout: LIST_TIMEOUT_MS },
        );

        const v5Seen = await accountsBalancesV5?.getSeenRequests();
        const v6Seen = await accountsBalancesV6?.getSeenRequests();
        assert.ok(
          (v5Seen?.length ?? 0) + (v6Seen?.length ?? 0) > 0,
          'Expected the extension to call Accounts API balances, but neither v5 nor v6 was requested',
        );
      },
    );
  });

  it('shows token amounts without fiat when the Price API returns 500', async function () {
    this.timeout(90_000);
    let spotPrices: MockedEndpoint | undefined;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
            },
          })
          .withAssetsController(
            {
              assetsPrice: {},
              assetsBalance: {
                [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                  [MAINNET_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
                },
              },
            },
            { overwrite: true },
          )
          .build(),
        title: this.test?.fullTitle(),
        unifiedEvmAccountsApiBalances: {
          mainnetNativeEthHuman: PRICE_API_MAINNET_BALANCE,
        },
        testSpecificMock: async (mockServer: Mockttp) => {
          spotPrices = await mockServer
            .forGet(`${PRICE_API}/v3/spot-prices`)
            .always()
            .thenCallback(() => ({ statusCode: 500, json: {} }));
          return [
            spotPrices,
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
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });

        const tokensTab = new TokensTab(driver);
        // Mainnet is Accounts-API supported, so the row updates to that
        // balance while spot-prices keeps failing. RPC is mocked to 0, which
        // would show if the price failure also dropped the API balance.
        await tokensTab.checkTokenExistsInList(
          'Ethereum',
          `${PRICE_API_MAINNET_BALANCE} ETH`,
          { timeout: LIST_TIMEOUT_MS, amountTimeout: LIST_TIMEOUT_MS },
        );
        await tokensTab.checkNoConversionRateDisplayed(LIST_TIMEOUT_MS);

        await assertEndpointWasCalled(spotPrices, 'Price API spot-prices');
      },
    );
  });

  it('keeps the Accounts API balance on processed chains and uses RPC for unprocessed chains', async function () {
    this.timeout(120_000);

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true, '0x89': true } })
          .withNetworkController({
            networksMetadata: {
              mainnet: { EIPS: {}, status: NetworkStatus.Available },
              'polygon-mainnet': {
                EIPS: {},
                status: NetworkStatus.Available,
              },
            },
          })
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: { assetsAccountsApiV6: true },
          })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
              '0x89': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
            },
          })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                [MAINNET_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
                [POLYGON_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          const balances = async (server: Mockttp, version: 'v5' | 'v6') =>
            server
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
            await balances(mockServer, 'v5'),
            await balances(mockServer, 'v6'),
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
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          'Ethereum',
          `${ACCOUNTS_API_MAINNET_BALANCE} ETH`,
          { timeout: LIST_TIMEOUT_MS, amountTimeout: LIST_TIMEOUT_MS },
        );
        await tokensTab.checkTokenExistsInList(
          'POL',
          `${POLYGON_RPC_BALANCE} POL`,
          {
            timeout: LIST_TIMEOUT_MS,
            amountTimeout: LIST_TIMEOUT_MS,
          },
        );
      },
    );
  });
});
