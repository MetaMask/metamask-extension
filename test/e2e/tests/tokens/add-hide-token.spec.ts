import { toHex } from '@metamask/controller-utils';
import { merge } from 'lodash';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import {
  createBalanceUpdateNotification,
  waitForAccountActivitySubscription,
} from '../../websocket/account-activity-mocks';
import WebSocketRegistry from '../../websocket/registry';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';

function mockCommonApis(mockServer: Mockttp) {
  return Promise.all([
    mockServer
      .forGet(
        /https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u,
      )
      .always()
      .thenJson(200, {
        fullSupport: [1, 137, 56, 59144, 8453, 10, 42161, 1337],
        partialSupport: { balances: [] },
      }),
    mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
      .always()
      .thenJson(200, {
        fullSupport: ['eip155:1', 'eip155:1337'],
        partialSupport: [],
      }),
    mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const assetIds = url.searchParams.getAll('assetIds').join(',');
        const results = [];
        if (assetIds.includes('eip155:1337')) {
          results.push({
            assetId: 'eip155:1337/slip44:1',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        }
        return { statusCode: 200, json: results };
      }),
  ]);
}

function mockV5Balances(mockServer: Mockttp, tstBalance: { value: string }) {
  const account = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
  const chainId = 1337;
  const tokenAddress = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';

  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 2,
        unprocessedNetworks: [],
        balances: [
          {
            accountId: `eip155:${chainId}:${account}`,
            assetId: `eip155:${chainId}/slip44:60`,
            balance: '25',
          },
          {
            accountId: `eip155:${chainId}:${account}`,
            assetId: `eip155:${chainId}/erc20:${tokenAddress}`,
            balance: tstBalance.value,
          },
        ],
      },
    }));
}

describe('Add hide token', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const tokenAddress = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';
  const chainId = 1337;
  const chainIdHex = toHex(chainId);
  const rawBalance = '0x186a0'; // 100000 raw = 10 TST (4 decimals)

  it('hides the token when clicked', async function () {
    const account = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
    const fixture = new FixtureBuilderV2()
      .withEnabledNetworks({ eip155: { [chainIdHex]: true } })
      .withTokensController({
        allTokens: {
          [chainIdHex]: {
            [account]: [
              {
                address: tokenAddress,
                decimals: 4,
                image: undefined,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          },
        },
      })
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            [`eip155:${chainId}/slip44:60`]: {
              amount: '25',
            },
            [`eip155:${chainId}/erc20:${tokenAddress}`]: {
              amount: '10',
            },
          },
        },
        assetsInfo: {
          [`eip155:${chainId}/slip44:60`]: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
            type: 'native',
          },
          [`eip155:${chainId}/erc20:${tokenAddress}`]: {
            aggregators: [],
            decimals: 4,
            image: undefined,
            name: 'Test Standard Token',
            symbol: 'TST',
            type: 'erc20',
          },
        },
      })
      .build();
    merge(fixture.data, {
      AccountTrackerController: {
        accountsByChainId: {
          [chainIdHex]: {
            [account]: {
              balance: '0x15af1d78b58c400000', // 25 ETH
            },
          },
        },
      },
      TokenBalancesController: {
        tokenBalances: {
          [account]: {
            [chainIdHex]: {
              [tokenAddress]: rawBalance,
            },
          },
        },
      },
    });
    await withFixtures(
      {
        fixtures: fixture,
        title: this.test?.fullTitle(),
        smartContract,
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockCommonApis(mockServer);
          await mockV5Balances(mockServer, { value: '10' });
        },
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.checkTokenAmountIsDisplayed('10 TST');

        await assetListPage.hideToken('TST');
        await assetListPage.checkTokenItemNumber(1);
      },
    );
  });

  // Under unified state (assetsUnifyState), the UI reads token balances from
  // AssetsController.assetsBalance, but the WebSocket balance update only
  // reaches TokenBalancesController. Until AssetsController subscribes to
  // AccountActivityService:balanceUpdated, this test cannot pass.
  // eslint-disable-next-line mocha/no-skipped-tests -- blocked until unified balance path receives WS updates
  it.skip('updates token balance when a WebSocket balance update is received', async function () {
    const account = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
    const tstBalanceHolder = { value: '10' };
    const fixture = new FixtureBuilderV2()
      .withEnabledNetworks({ eip155: { [chainIdHex]: true } })
      .withTokensController({
        allTokens: {
          [chainIdHex]: {
            [account]: [
              {
                address: tokenAddress,
                decimals: 4,
                image: undefined,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          },
        },
      })
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            [`eip155:${chainId}/erc20:${tokenAddress}`]: {
              amount: '10',
            },
          },
        },
        assetsInfo: {
          [`eip155:${chainId}/erc20:${tokenAddress}`]: {
            aggregators: [],
            decimals: 4,
            image: undefined,
            name: 'Test Standard Token',
            symbol: 'TST',
            type: 'erc20',
          },
        },
      })
      .build();
    merge(fixture.data, {
      TokenBalancesController: {
        tokenBalances: {
          [account]: {
            [chainIdHex]: {
              [tokenAddress]: rawBalance,
            },
          },
        },
      },
    });
    await withFixtures(
      {
        fixtures: fixture,
        title: this.test?.fullTitle(),
        smartContract,
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockCommonApis(mockServer);
          await mockV5Balances(mockServer, tstBalanceHolder);
        },
      },
      async ({ driver }) => {
        const wsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.accountActivity,
        );

        // Register the subscription waiter BEFORE login so we don't miss
        // the subscribe handshake if auth completes quickly.
        const subscriptionPromise = waitForAccountActivitySubscription();

        await login(driver, { validateBalance: false });

        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenAmountIsDisplayed('10 TST');

        const subscriptionId = await subscriptionPromise;
        console.log(`Subscription established: ${subscriptionId}`);
        const notification = createBalanceUpdateNotification({
          subscriptionId,
          channel: `account-activity.v1.eip155:0:${account}`,
          address: account,
          chain: `eip155:${chainId}`,
          updates: [
            {
              asset: {
                fungible: true,
                type: `eip155:${chainId}/erc20:${tokenAddress}`,
                unit: tokenAddress,
                decimals: 4,
              },
              postBalance: { amount: '0x30d40' }, // 200000 raw = 20 TST (4 decimals)
              transfers: [
                {
                  from: '0x0000000000000000000000000000000000000000',
                  to: account,
                  amount: '0x186a0',
                },
              ],
            },
          ],
        });
        // Update V5 mock so any re-fetch returns the new balance
        tstBalanceHolder.value = '20';
        wsServer.sendMessage(JSON.stringify(notification));

        // Verify the UI updates to reflect the new balance
        await assetListPage.checkTokenAmountIsDisplayed('20 TST');
      },
    );
  });
});
