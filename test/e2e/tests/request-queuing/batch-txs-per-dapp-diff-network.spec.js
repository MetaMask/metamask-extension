const { By } = require('selenium-webdriver');
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

describe('Request Queuing for Multiple Dapps and Txs on different networks', function () {
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

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp 1
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
          text: 'Confirm',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
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

        await switchToNotificationWindow(driver, 4);

        await driver.findElement(
          By.xpath("//div[normalize-space(.)='1 of 2']"),
        );

        // Check correct network on confirm tx.
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8545',
        });

        // Reject All Transactions
        await driver.clickElement('.page-container__footer-secondary a');

        await driver.clickElement({ text: 'Reject all', tag: 'button' }); // TODO: Do we want to confirm here?

        // Wait for confirmation to close
        await driver.waitUntilXWindowHandles(3);

        // Wait for new confirmations queued from second dapp to open
        await switchToNotificationWindow(driver, 4);

        await driver.findElement(
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
