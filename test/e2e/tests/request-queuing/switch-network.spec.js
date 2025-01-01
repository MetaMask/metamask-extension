const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

describe('Request Queuing Switch Network on Dapp Send Tx while on different networks.', function () {
  describe('Old confirmation screens', function () {
    it('should switch to the dapps network automatically when mm network differs, dapp tx is on correct network', async function () {
      const port = 8546;
      const chainId = 1338;
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleGanache()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesControllerUseRequestQueueEnabled()
            .build(),
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port,
                chainId,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open dapp
          await openDapp(driver, undefined, DAPP_URL);

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

          // Queue confirm tx should first auto switch network
          await driver.clickElement('#sendButton');

          await driver.delay(regularDelayMs);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm Transaction
          await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
          await driver.clickElement(
            '[data-testid="page-container-footer-next"]',
          );

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

  describe('Redesigned confirmation screens', function () {
    it('should switch to the dapps network automatically when mm network differs, dapp tx is on correct network', async function () {
      const port = 8546;
      const chainId = 1338;
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleGanache()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesControllerUseRequestQueueEnabled()
            .build(),
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port,
                chainId,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          // Open dapp
          await openDapp(driver, undefined, DAPP_URL);

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

          // Queue confirm tx should first auto switch network
          await driver.clickElement('#sendButton');

          await driver.delay(regularDelayMs);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm Transaction
          await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

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
});
