const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
  switchToNotificationWindow,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

describe('Request Queuing', function () {
  it('should clear tx confirmation when revokePermission is called from origin dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
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
          text: 'Confirm',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.waitUntilXWindowHandles(2);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await driver.clickElement('#sendButton');

        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // wallet_revokePermissions request
        const revokePermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });

        await driver.executeScript(
          `return window.ethereum.request(${revokePermissionsRequest})`,
        );

        // Should have cleared the tx confirmation
        await driver.waitUntilXWindowHandles(2);

        // Cleared eth_accounts account label
        await driver.findElement({ xpath: '//span[@id="accounts"][.=""]' });
      },
    );
  });
});
