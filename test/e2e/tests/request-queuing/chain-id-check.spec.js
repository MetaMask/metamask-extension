const { strict: assert } = require('assert');
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
  it('should keep chain id the same with request queuing and switching mm network with a connected site.', async function () {
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

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const request = JSON.stringify({
          method: 'eth_chainId',
        });

        const firstChainIdCall = await driver.executeScript(
          `return window.ethereum.request(${request})`,
        );

        assert.equal(firstChainIdCall, '0x539'); // 1337

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

        const secondChainIdCall = await driver.executeScript(
          `return window.ethereum.request(${request})`,
        );

        assert.equal(secondChainIdCall, '0x539'); // 1337
      },
    );
  });
});
