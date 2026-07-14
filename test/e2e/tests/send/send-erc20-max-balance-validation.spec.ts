/**
 * Send ERC20 - Max Balance Validation (ASSETS-3385)
 *
 * Regression test for ASSETS-3385 ("Max Send balance not updating").
 *
 * The bug only reproduces on supported chains where balances come from the
 * Accounts API / Account Activity WebSocket (e.g. Arbitrum), NOT from RPC.
 * After a balance update arrives over the WebSocket, the UI must reflect it
 * both in the Tokens list AND in the Send flow's "Max" amount. The bug is that
 * `AssetsController.assetsBalance` (which the UI reads under unified state) does
 * not update from the WebSocket path, so the Tokens list and "Max" stay stale.
 *
 * This test is SKIPPED because the fix is not yet in: until `AssetsController`
 * subscribes to `AccountActivityService:balanceUpdated`, the assertions below
 * cannot pass.
 */

import { strict as assert } from 'assert';
import { merge } from 'lodash';
import { toHex } from '@metamask/controller-utils';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import SendPage from '../../page-objects/pages/send/send-page';
import {
  createBalanceUpdateNotification,
  waitForAccountActivitySubscription,
} from '../../websocket/account-activity-mocks';
import WebSocketRegistry from '../../websocket/registry';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';

const CHAIN_ID = 1337;
const CHAIN_ID_HEX = toHex(CHAIN_ID);
const TOKEN_ADDRESS = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';
const TOKEN_DECIMALS = 4;
const SYMBOL = 'TST';
// 100000 raw = 10 TST (4 decimals)
const INITIAL_RAW_BALANCE = '0x186a0';
// 50000 raw = 5 TST (4 decimals) — the post-send balance reported over the WS
const POST_SEND_RAW_BALANCE = '0xc350';
// A valid, arbitrary recipient so the Send form is interactable.
const RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

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
            accountId: `eip155:${CHAIN_ID}:${account}`,
            assetId: `eip155:${CHAIN_ID}/slip44:60`,
            balance: '25',
          },
          {
            accountId: `eip155:${CHAIN_ID}:${account}`,
            assetId: `eip155:${CHAIN_ID}/erc20:${TOKEN_ADDRESS}`,
            balance: tstBalance.value,
          },
        ],
      },
    }));
}

describe('Send ERC20 - Max Balance Validation', function () {
  it('reflects a WebSocket balance update in the Tokens list and Send "Max"', async function () {
    const account = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
    const tstBalanceHolder = { value: '10' };

    const fixture = new FixtureBuilderV2()
      .withEnabledNetworks({ eip155: { [CHAIN_ID_HEX]: true } })
      .withTokensController({
        allTokens: {
          [CHAIN_ID_HEX]: {
            [account]: [
              {
                address: TOKEN_ADDRESS,
                decimals: TOKEN_DECIMALS,
                image: undefined,
                isERC721: false,
                symbol: SYMBOL,
              },
            ],
          },
        },
      })
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            [`eip155:${CHAIN_ID}/slip44:60`]: {
              amount: '25',
            },
            [`eip155:${CHAIN_ID}/erc20:${TOKEN_ADDRESS}`]: {
              amount: '10',
            },
          },
        },
        assetsInfo: {
          [`eip155:${CHAIN_ID}/slip44:60`]: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
            type: 'native',
          },
          [`eip155:${CHAIN_ID}/erc20:${TOKEN_ADDRESS}`]: {
            aggregators: [],
            decimals: TOKEN_DECIMALS,
            image: undefined,
            name: 'Test Standard Token',
            symbol: SYMBOL,
            type: 'erc20',
          },
        },
      })
      .build();

    merge(fixture.data, {
      AccountTrackerController: {
        accountsByChainId: {
          [CHAIN_ID_HEX]: {
            [account]: {
              balance: '0x15af1d78b58c400000', // 25 ETH
            },
          },
        },
      },
      TokenBalancesController: {
        tokenBalances: {
          [account]: {
            [CHAIN_ID_HEX]: {
              [TOKEN_ADDRESS]: INITIAL_RAW_BALANCE,
            },
          },
        },
      },
    });

    await withFixtures(
      {
        fixtures: fixture,
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockCommonApis(mockServer);
          await mockV5Balances(mockServer, tstBalanceHolder);
        },
      },
      async ({ driver }) => {
        const wsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.accountActivity,
        );

        // Register the subscription waiter BEFORE login so we don't miss the
        // subscribe handshake if auth completes quickly.
        const subscriptionPromise = waitForAccountActivitySubscription();

        await login(driver, { validateBalance: false });

        const tokensTab = new TokensTab(driver);
        const sendPage = new SendPage(driver);

        // baseline: the Tokens list shows the seeded 10 TST balance
        await tokensTab.checkTokenAmountIsDisplayed(`10 ${SYMBOL}`);

        // simulate a Send: the Account Activity WebSocket reports the
        // post-send balance (5 TST). This is the path that regressed —
        // balances on supported chains arrive via the WS, not via RPC.
        const subscriptionId = await subscriptionPromise;
        console.log(`Subscription established: ${subscriptionId}`);
        const notification = createBalanceUpdateNotification({
          subscriptionId,
          channel: `account-activity.v1.eip155:0:${account}`,
          address: account,
          chain: `eip155:${CHAIN_ID}`,
          updates: [
            {
              asset: {
                fungible: true,
                type: `eip155:${CHAIN_ID}/erc20:${TOKEN_ADDRESS}`,
                unit: SYMBOL,
                decimals: TOKEN_DECIMALS,
              },
              postBalance: { amount: POST_SEND_RAW_BALANCE }, // 5 TST remaining
              transfers: [
                {
                  from: account,
                  to: '0x0000000000000000000000000000000000000000',
                  amount: POST_SEND_RAW_BALANCE,
                },
              ],
            },
          ],
        });
        // Keep the V5 mock in sync so any re-fetch returns the new balance.
        tstBalanceHolder.value = '5';
        wsServer.sendMessage(JSON.stringify(notification));

        // core ASSETS-3385 assertion: the Tokens list must reflect the
        // updated balance (5 TST), not the stale pre-send balance (10 TST).
        await tokensTab.checkTokenAmountIsDisplayed(`5 ${SYMBOL}`);

        // open the Send flow and click "Max": it must fill the UPDATED balance
        // (5 TST). If the bug is present, "Max" fills the stale 10 TST.
        await tokensTab.openTokenDetails(SYMBOL);
        await tokensTab.startSendFlow();
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });

        await sendPage.clickMaxButton();
        const maxAfterUpdate = await sendPage.getAmountInputValue();
        assert.equal(
          parseFloat(maxAfterUpdate),
          5,
          `Max should fill the updated balance (5 ${SYMBOL}), but filled "${maxAfterUpdate}"`,
        );

        // sending the Max (available) balance is valid
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue should be enabled when sending the Max (available) balance',
        );

        // a re-send above the updated balance must be blocked
        await sendPage.fillAmount('10');
        await sendPage.checkInsufficientFundsError();
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue should be disabled when balance is insufficient',
        );
      },
    );
  });
});
