import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';

describe('Request Queueing', function () {
  it('should keep subscription on dapp network when switching different mm network', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },

      async ({ driver, localNodes }) => {
        await loginWithoutBalanceValidation(driver);

        // Connect to dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectAccount({});
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Subscribe to newHeads event
        const subscribeRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_subscribe',
          params: ['newHeads'],
        });

        await driver.executeScript(
          `return window.ethereum.request(${subscribeRequest})`,
        );

        // Save event logs into the messages variable in the window context, to access it later
        await driver.executeScript(`
          window.messages = [];
          window.ethereum.on('message', (message) => {
            if (message.type === 'eth_subscription') {
              console.log('New block header:', message.data.result);
              window.messages.push(message.data.result);
            }
          });
        `);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Switch networks
        await switchToNetworkFromSendFlow(driver, 'Localhost 8546');

        // Navigate back to the test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Access to the window messages variable
        const messagesBeforeMining = await driver.executeScript(
          'return window.messages;',
        );

        // Mine a block deterministically
        await localNodes[0].mineBlock();

        // Wait a couple of seconds for the logs to populate into the messages window variable
        await driver.delay(5000);

        // Access the window messages variable and check there are more events than before mining
        const messagesAfterMining = await driver.executeScript(
          'return window.messages;',
        );

        assert.ok(messagesBeforeMining.length < messagesAfterMining.length);
      },
    );
  });
});
