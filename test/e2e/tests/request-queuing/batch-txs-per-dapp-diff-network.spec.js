const { By } = require('selenium-webdriver');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
  defaultGanacheOptions,
  largeDelayMs,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');

describe('Request Queuing for Multiple Dapps and Txs on different networks', function () {
  describe('Old confirmation screens', function () {
    it('should batch confirmation txs for different dapps on different networks.', async function () {
      const port = 8546;
      const chainId = 1338;
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleGanache()
            .withPreferencesControllerUseRequestQueueEnabled()
            .build(),
          dappOptions: { numberOfDapps: 2 },
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
            By.xpath("//div[normalize-space(.)='1 of 2']"),
          );

          // Reject All Transactions
          await driver.clickElement('.page-container__footer-secondary a');

          // TODO: Do we want to confirm here?
          await driver.clickElementAndWaitForWindowToClose({
            text: 'Reject all',
            tag: 'button',
          });

          // Wait for confirmation to close
          // TODO: find a better way to handle different dialog ids
          await driver.delay(2000);

          // Wait for new confirmations queued from second dapp to open
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.waitForSelector(
            By.xpath("//div[normalize-space(.)='1 of 2']"),
          );

          // Check correct network on confirm tx.
          await driver.findElement({
            css: '[data-testid="network-display"]',
            text: 'Localhost 8546',
          });
        },
      );
    });
  });

  describe('Redesigned confirmation screens', function () {
    it('should batch confirmation txs for different dapps on different networks.', async function () {
      const port = 8546;
      const chainId = 1338;
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleGanache()
            .withPreferencesControllerUseRequestQueueEnabled()
            .build(),
          dappOptions: { numberOfDapps: 2 },
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
            By.xpath("//p[normalize-space(.)='1 of 2']"),
          );

          await driver.clickElementAndWaitForWindowToClose({
            text: 'Reject all',
            tag: 'button',
          });

          // Wait for confirmation to close
          await driver.delay(2000);

          // Wait for new confirmations queued from second dapp to open
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.waitForSelector(
            By.xpath("//p[normalize-space(.)='1 of 2']"),
          );

          // Check correct network on confirm tx.
          await driver.findElement({
            css: 'p',
            text: 'Localhost 8546',
          });
        },
      );
    });
  });
});
