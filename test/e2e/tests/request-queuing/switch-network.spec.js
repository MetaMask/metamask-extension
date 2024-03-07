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

describe('Request Queuing Switch Network on Dapp Send Tx while on different networks.', function () {
  it('should show switch network dialog while dapp and mm network differ, dapp tx is on correct network.', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
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

        // Wait for Connecting notification to close.
        await driver.waitUntilXWindowHandles(2);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await driver.clickElement('[data-testid="network-display"]');

        // Switch to second network
        await driver.clickElement({
          text: 'Localhost 8546',
          css: 'p',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Queue confirm tx should show switch chain first when on different network
        await driver.clickElement('#sendButton');

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
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
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
