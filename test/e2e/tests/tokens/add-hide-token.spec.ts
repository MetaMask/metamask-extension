import { toHex } from '@metamask/controller-utils';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  createBalanceUpdateNotification,
  waitForAccountActivitySubscription,
} from '../../websocket/account-activity-mocks';
import WebSocketRegistry from '../../websocket/registry';

describe('Add hide token', function () {
  const smartContract = SMART_CONTRACTS.HST;
  it('hides the token when clicked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x539': true } })
          .withTokensController({
            allTokens: {
              [toHex(1337)]: {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .withTokenBalancesController({
            tokenBalances: {
              '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                [toHex(1337)]: {
                  '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947': '0x186a0', // 100000 in hex (10 TST with 4 decimals)
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        smartContract,
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.checkTokenAmountIsDisplayed('10 TST');

        await assetListPage.hideToken('TST');
        await assetListPage.checkTokenItemNumber(1);
      },
    );
  });

  it('updates token balance when a WebSocket balance update is received', async function () {
    const account = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
    const tokenAddress = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';
    const chainId = 1337;

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x539': true } })
          .withTokensController({
            allTokens: {
              [toHex(chainId)]: {
                [account]: [
                  {
                    address: tokenAddress,
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST',
                  },
                ],
              },
            },
            tokens: [
              {
                address: tokenAddress,
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .withTokenBalancesController({
            tokenBalances: {
              [account]: {
                [toHex(chainId)]: {
                  [tokenAddress]: '0x186a0', // 100000 raw = 10 TST (4 decimals)
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        smartContract,
      },
      async ({ driver, localNodes }) => {
        const wsServer = WebSocketRegistry.getServer('accountActivity');

        // Register the subscription waiter BEFORE login so we don't miss
        // the subscribe handshake if auth completes quickly.
        const subscriptionPromise = waitForAccountActivitySubscription();

        await loginWithBalanceValidation(driver, localNodes[0]);

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
        wsServer.sendMessage(JSON.stringify(notification));

        // Verify the UI updates to reflect the new balance
        await assetListPage.checkTokenAmountIsDisplayed('20 TST');
      },
    );
  });
});
