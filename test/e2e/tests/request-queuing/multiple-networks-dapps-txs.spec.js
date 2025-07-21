const {
  switchToNetworkFromSendFlow,
} = require('../../page-objects/flows/network.flow');

const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
  largeDelayMs,
} = require('../../helpers');

describe('Request Queuing for Multiple Dapps and Txs on different networks.', function () {
  it('should be possible to send requests from different dapps on different networks', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({
            eip155: {
              '0x53a': true,
            },
          })
          .withNetworkControllerDoubleNode()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        dappOptions: { numberOfDapps: 2 },
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp 1
        await driver.clickElement({ text: 'Connect', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await switchToNetworkFromSendFlow(driver, 'Localhost 8546');

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // Connect to dapp 2
        await driver.clickElement({ text: 'Connect', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        // Dapp one send tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.delay(largeDelayMs);
        await driver.clickElement('#sendButton');

        await driver.waitUntilXWindowHandles(4);

        // Dapp two send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await driver.delay(largeDelayMs);
        await driver.clickElement('#sendButton');

        // First switch network
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for confirm tx after switch network confirmation.
        await driver.delay(largeDelayMs);

        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Reject Transaction
        await driver.findClickableElement({ text: 'Cancel', tag: 'button' });
        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        // TODO: No second confirmation from dapp two will show, have to go back to the extension to see the switch chain & dapp two's tx.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );

        // Check for unconfirmed transaction in tx list
        await driver.wait(async () => {
          const unconfirmedTxes = await driver.findElements(
            '.transaction-list-item--unconfirmed',
          );
          return unconfirmedTxes.length === 1;
        }, 10000);

        // Click Unconfirmed Tx
        await driver.clickElement('.transaction-list-item--unconfirmed');

        // Confirm Tx
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Check for Confirmed Transaction
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);
      },
    );
  });
});
