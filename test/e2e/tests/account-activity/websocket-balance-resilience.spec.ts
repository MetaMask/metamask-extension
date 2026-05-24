import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import WebSocketRegistry from '../../websocket/registry';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';
import {
  waitForAccountActivitySubscription,
  createBalanceUpdateNotification,
  accountActivityWebSocketConfig,
} from '../../websocket/account-activity-mocks';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../constants';
import { Anvil } from '../../seeder/anvil';

const FIFTY_ETH_WEI = '0x2b5e3af16b1880000';
const THIRTY_FIVE_ETH_WEI = '0x1e5b8fa8fe2ac0000';
const BALANCE_POLL_TIMEOUT = 90_000;
const RECONNECT_TIMEOUT = 60_000;

async function waitForAccountActivityWsConnections(
  driver: Driver,
  expectedCount: number,
  timeoutMs = 20_000,
): Promise<void> {
  await driver.wait(async () => {
    return (
      WebSocketRegistry.getServer(
        WEBSOCKET_SERVICES.accountActivity,
      ).getWebsocketConnectionCount() === expectedCount
    );
  }, timeoutMs);
}

async function waitForBalanceUpdate(
  homepage: HomePage,
  driver: Driver,
  expectedBalance: string,
  timeoutMs = BALANCE_POLL_TIMEOUT,
): Promise<void> {
  await driver.wait(async () => {
    try {
      await homepage.checkExpectedBalanceIsDisplayed(expectedBalance);
      return true;
    } catch {
      return false;
    }
  }, timeoutMs);
}

async function mockDisabledWebsocketBalance(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            backendWebSocketConnection: false,
          },
        ],
      };
    });
}

describe('Account Activity WebSocket Balance Resilience', function (this: Suite) {
  describe('REST Polling Fallback', function () {
    it('balance updates continue via REST polling when WebSocket disconnects', async function () {
      this.timeout(90_000);

      // Mutable object passed to the global mock in mock-e2e.js.
      // The mock reads defaultNativeEthHuman on every poll, so flipping it
      // mid-test changes what the next Accounts API response returns.
      const balanceOverride: { nativeBalance: string } = {
        nativeBalance: '25',
      };

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          unifiedEvmAccountsApiBalances: balanceOverride,
        },
        async ({
          driver,
          localNodes,
        }: {
          driver: Driver;
          localNodes: Anvil[];
        }) => {
          const subPromise = waitForAccountActivitySubscription();

          await login(driver);
          await waitForAccountActivityWsConnections(driver, 1);
          await subPromise;

          const homepage = new HomePage(driver);
          await homepage.checkExpectedBalanceIsDisplayed('25');

          const server = WebSocketRegistry.getServer(
            WEBSOCKET_SERVICES.accountActivity,
          );
          await server.stopAndCleanup();

          await localNodes[0].setAccountBalance(
            DEFAULT_FIXTURE_ACCOUNT,
            FIFTY_ETH_WEI,
          );

          // Switch the Accounts API response so the next REST poll returns 50 ETH
          balanceOverride.nativeBalance = '50';

          await waitForBalanceUpdate(homepage, driver, '50');
        },
      );
    });
  });

  describe('Reconnection', function () {
    it('WebSocket reconnects and real-time updates resume after server recovery', async function () {
      this.timeout(240_000);

      const balanceOverride: { nativeBalance: string } = {
        nativeBalance: '25',
      };

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          unifiedEvmAccountsApiBalances: balanceOverride,
        },
        async ({
          driver,
          localNodes,
        }: {
          driver: Driver;
          localNodes: Anvil[];
        }) => {
          const subPromise = waitForAccountActivitySubscription();
          await login(driver);
          await waitForAccountActivityWsConnections(driver, 1);
          await subPromise;

          const homepage = new HomePage(driver);
          await homepage.checkExpectedBalanceIsDisplayed('25');

          const server = WebSocketRegistry.getServer(
            WEBSOCKET_SERVICES.accountActivity,
          );
          await server.stopAndCleanup();
          await waitForAccountActivityWsConnections(driver, 0);

          server.start();
          await accountActivityWebSocketConfig.setup(server, []);

          // Waiter must be registered AFTER setup (which resets module state)
          // but BEFORE the extension reconnects. Because setup is synchronous,
          // no reconnection can slip in between these two calls.
          const reconnectSubPromise =
            waitForAccountActivitySubscription(RECONNECT_TIMEOUT);

          await waitForAccountActivityWsConnections(
            driver,
            1,
            RECONNECT_TIMEOUT,
          );
          const newSubId = await reconnectSubPromise;

          await localNodes[0].setAccountBalance(
            DEFAULT_FIXTURE_ACCOUNT,
            THIRTY_FIVE_ETH_WEI,
          );

          balanceOverride.nativeBalance = '35';

          const notification = createBalanceUpdateNotification({
            subscriptionId: newSubId,
            channel: `account-activity.v1.eip155:1337.${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            chain: 'eip155:1337',
            updates: [
              {
                asset: {
                  fungible: true,
                  type: 'eip155:1337/slip44:1',
                  unit: 'ETH',
                  decimals: 18,
                },
                postBalance: { amount: '35000000000000000000' },
                transfers: [
                  {
                    from: '0x0000000000000000000000000000000000000000',
                    to: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
                    amount: '10000000000000000000',
                  },
                ],
              },
            ],
          });
          server.sendMessage(JSON.stringify(notification));

          await waitForBalanceUpdate(homepage, driver, '35');
        },
      );
    });
  });

  it('balance updates work via REST polling when WebSocket feature flag is disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        // At the moment, setting this flag has no effect because of this issue #42049, so we need to mock the request
        manifestFlags: {
          remoteFeatureFlags: {
            backendWebSocketConnection: { value: false },
          },
        },
        testSpecificMock: mockDisabledWebsocketBalance,
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await login(driver);
        const homepage = new HomePage(driver);

        const connectionCount = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.accountActivity,
        ).getWebsocketConnectionCount();

        assert.equal(
          connectionCount,
          0,
          `Expected 0 WebSocket connections with feature flag disabled, got ${connectionCount}`,
        );

        await localNodes[0].setAccountBalance(
          DEFAULT_FIXTURE_ACCOUNT,
          FIFTY_ETH_WEI,
        );

        await waitForBalanceUpdate(homepage, driver, '50');
      },
    );
  });
});
