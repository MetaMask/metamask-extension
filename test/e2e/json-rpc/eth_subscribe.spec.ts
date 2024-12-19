import { strict as assert } from 'assert';
import { defaultGanacheOptions, withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { Ganache } from '../seeder/ganache';

describe('eth_subscribe', function () {
  it('executes a subscription event', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // eth_subscribe
        await driver.openNewPage(`http://127.0.0.1:8080`);

        const subscribeRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_subscribe',
          params: ['newHeads'],
        });

        const subscribe: string = (await driver.executeScript(
          `return window.ethereum.request(${subscribeRequest})`,
        )) as string;

        type SubscriptionMessage = {
          data: {
            subscription: string;
          };
          type: string;
        };

        const subscriptionMessage: SubscriptionMessage =
          (await driver.executeAsyncScript(
            `const callback = arguments[arguments.length - 1];
           window.ethereum.on('message', (message) => callback(message))`,
          )) as SubscriptionMessage;

        assert.strictEqual(subscribe, subscriptionMessage.data.subscription);
        assert.strictEqual(subscriptionMessage.type, 'eth_subscription');

        // eth_unsubscribe
        const unsubscribeRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_unsubscribe',
          params: [subscribe],
        });

        const unsubscribe: boolean = (await driver.executeScript(
          `return window.ethereum.request(${unsubscribeRequest})`,
        )) as boolean;

        assert.strictEqual(unsubscribe, true);
      },
    );
  });
});
