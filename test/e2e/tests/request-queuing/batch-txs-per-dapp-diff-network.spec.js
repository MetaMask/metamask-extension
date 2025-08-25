const { By } = require('selenium-webdriver');
const {
  switchToNetworkFromSendFlow,
} = require('../../page-objects/flows/network.flow');
const { isManifestV3 } = require('../../../../shared/modules/mv3.utils');
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

describe('Request Queuing for Multiple Dapps and Txs on different networks', function () {
  it('should put confirmation txs for different dapps on different networks in single queue', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
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

        // Wait for the first dapp's connect confirmation to disappear
        await driver.waitUntilXWindowHandles(2);

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
        await driver.clickElement('#sendButton');

        await driver.delay(largeDelayMs);

        // Dapp two send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await driver.delay(largeDelayMs);
        await driver.clickElement('#sendButton');
        await driver.clickElement('#sendButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector(
          By.xpath("//p[normalize-space(.)='1 of 4']"),
        );

        await driver.findElement({
          css: 'p',
          text: 'Localhost 8545',
        });

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );
        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        await driver.findElement({
          css: 'p',
          text: 'Localhost 8546',
        });

        if (isManifestV3) {
          await driver.clickElement({
            text: 'Reject all',
            tag: 'button',
          });
        } else {
          await driver.clickElementAndWaitForWindowToClose({
            text: 'Reject all',
            tag: 'button',
          });
        }

        await driver.waitUntilXWindowHandles(3);
      },
    );
  });
});
