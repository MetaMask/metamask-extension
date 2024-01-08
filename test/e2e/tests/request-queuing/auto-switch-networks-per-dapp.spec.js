const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
  largeDelayMs,
  switchToNotificationWindow,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

describe('Request Queuing for Multiple Dapps and Txs on different networks.', function () {
  it('should show switch network confirmations for per dapp selected networks when calling send transactions @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        dappOptions: { numberOfDapps: 2 },
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

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

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

        // Wait for the first dapp's connect confirmation to disappear
        await driver.waitUntilXWindowHandles(2);

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // Connect to dapp
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await switchToNotificationWindow(driver, 4);

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

        // Dapp one send tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.clickElement('#sendButton');

        await driver.delay(largeDelayMs);

        // Dapp two send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await driver.clickElement('#sendButton');

        await driver.delay(largeDelayMs);

        // First switch network confirmation
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findClickableElement({
          text: 'Switch network',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // Wait for confirm tx after switch network confirmation.
        await driver.delay(largeDelayMs);

        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Find correct network on confirm tx
        await driver.findElement({
          text: 'Localhost 8545',
          tag: 'span',
        });

        // Reject Transaction
        await driver.findClickableElement({ text: 'Reject', tag: 'button' });
        await driver.clickElement(
          '[data-testid="page-container-footer-cancel"]',
        );

        // TODO: No second confirmation from dapp two will show, have to go back to the extension to see the switch chain & dapp two's tx.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // TODO: Reload fix to have the confirmations show
        await driver.executeScript(`window.location.reload()`);

        // Second Switch Network Confirmation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.findElement({
          css: '[data-testid="network-switch-from-network"]',
          text: 'Localhost 8545',
        });

        await driver.findElement({
          css: '[data-testid="network-switch-to-network"]',
          text: 'Localhost 8546',
        });

        // Switch Network
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

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
        await driver.clickElement('[data-testid="page-container-footer-next"]');

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
