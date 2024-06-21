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

describe('Request-queue chainId proxy sync', function () {
  it('should preserve per dapp network selections after connecting without refresh calls @no-mmi', async function () {
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

        await driver.delay(regularDelayMs);

        const chainIdRequest = JSON.stringify({
          method: 'eth_chainId',
        });

        const chainIdCheckBeforeConnect = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );

        assert.equal(chainIdCheckBeforeConnect, '0x539'); // 1337

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await driver.clickElement('[data-testid="network-display"]');

        // Switch to second network
        await driver.clickElement({
          text: 'Ethereum Mainnet',
          css: 'p',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const secondChainIdCheckBeforeConnect = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );

        // before connecting the chainId should change with the wallet
        assert.equal(secondChainIdCheckBeforeConnect, '0x1');

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

        const firstChainIdCallAfterConnect = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );

        assert.equal(firstChainIdCallAfterConnect, '0x1');

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
          `return window.ethereum.request(${chainIdRequest})`,
        );
        // after connecting the dapp should now have its own selected network
        // independent from the globally selected and therefore should not have changed
        assert.equal(secondChainIdCall, '0x1');
      },
    );
  });
});
