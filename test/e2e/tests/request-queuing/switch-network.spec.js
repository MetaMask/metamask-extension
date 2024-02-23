const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  regularDelayMs,
  WINDOW_TITLES,
  switchToNotificationWindow,
  defaultGanacheOptions,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

// TODO: Have to turn on the setting every time we want to test the setting!?!
// TODO: Test this in prod, refresh the extension when the setting is on and you have to disable/enable it for the switchEthereumChain notification to work.

describe('Request Queuing Switch Network on Dapp Send Tx while on different networks.', function () {
  it('should show switch network dialog while dapp and mm network differ, dapp tx is on correct network.', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: {
            port,
            chainId,
            ganacheOptions2: defaultGanacheOptions,
          },
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open account menu button
        const accountOptionsMenuSelector =
          '[data-testid="account-options-menu-button"]';
        await driver.waitForSelector(accountOptionsMenuSelector);
        await driver.clickElement(accountOptionsMenuSelector);

        // Click settings from dropdown menu
        const globalMenuSettingsSelector =
          '[data-testid="global-menu-settings"]';
        await driver.waitForSelector(globalMenuSettingsSelector);
        await driver.clickElement(globalMenuSettingsSelector);

        // Click Experimental tab
        const securityAndPrivacyTabRawLocator = {
          text: 'Experimental',
          tag: 'div',
        };
        await driver.clickElement(securityAndPrivacyTabRawLocator);

        await driver.findClickableElement('.request-queue-toggle');

        // Toggle request queue setting
        await driver.clickElement('.request-queue-toggle');

        // Open dapp
        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await driver.waitUntilXWindowHandles(3);

        // Connect to Dapp
        await switchToNotificationWindow(driver);

        await driver.clickElement({
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        // Window Handling
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dappOne = windowHandles[1];

        await driver.switchToWindow(extension);

        // Network Selector
        await driver.clickElement('[data-testid="network-display"]');

        // Switch to second network
        await driver.clickElement({
          text: 'Localhost 8546',
          css: 'p',
        });

        await driver.switchToWindow(dappOne);

        // Queue confirm tx should show switch chain first when on different network
        await driver.clickElement('#sendButton');

        await driver.delay(regularDelayMs);

        await driver.waitUntilXWindowHandles(3);

        await switchToNotificationWindow(driver);

        // Switch Chain Confirmation
        await driver.findElement({
          css: '[data-testid="network-switch-from-network"]',
          text: 'Localhost 8546',
        });

        await driver.findElement({
          css: '[data-testid="network-switch-to-network"]',
          text: 'Localhost 8545',
        });

        // Confirm Switch Chain
        await driver.findClickableElement({
          text: 'Switch network',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // Wait for confirm tx after switch network confirmation.
        await driver.delay(regularDelayMs);

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm Transaction
        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement('[data-testid="page-container-footer-next"]');

        await driver.delay(regularDelayMs);

        // Switch back to the extension
        await driver.switchToWindow(extension);
        await driver.navigate(PAGES.HOME);

        // Check correct network switched and on the correct network
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8545',
        });

        // Check for transaction
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
