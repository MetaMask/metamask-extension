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

describe('Request Queueing chainId proxy sync', function () {
  describe('request queue is on', function () {
    it('should preserve per dapp network selections after connecting and switching without refresh calls @no-mmi', async function () {
      const port = 8546;
      const chainId = 1338;
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerDoubleGanache()

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

          const chainIdBeforeConnect = await driver.executeScript(
            `return window.ethereum.request(${chainIdRequest})`,
          );

          assert.equal(chainIdBeforeConnect, '0x539'); // 1337

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

          const chainIdBeforeConnectAfterManualSwitch =
            await driver.executeScript(
              `return window.ethereum.request(${chainIdRequest})`,
            );

          // before connecting the chainId should change with the wallet
          assert.equal(chainIdBeforeConnectAfterManualSwitch, '0x1');

          // Connect to dapp
          await driver.findClickableElement({ text: 'Connect', tag: 'button' });
          await driver.clickElement('#connectButton');

          await driver.delay(regularDelayMs);

          await switchToNotificationWindow(driver);

          await driver.clickElement({
            text: 'Connect',
            tag: 'button',
          });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          const chainIdAfterConnect = await driver.executeScript(
            `return window.ethereum.request(${chainIdRequest})`,
          );

          // should still be on the same chainId as the wallet after connecting
          assert.equal(chainIdAfterConnect, '0x1');

          const switchEthereumChainRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }],
          });

          await driver.executeScript(
            `window.ethereum.request(${switchEthereumChainRequest})`,
          );

          await switchToNotificationWindow(driver);
          await driver.findClickableElements({
            text: 'Confirm',
            tag: 'button',
          });

          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          const chainIdAfterDappSwitch = await driver.executeScript(
            `return window.ethereum.request(${chainIdRequest})`,
          );

          // should be on the new chainId that was requested
          assert.equal(chainIdAfterDappSwitch, '0x539'); // 1337

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Network Selector
          await driver.clickElement('[data-testid="network-display"]');

          // Switch network
          await driver.clickElement({
            text: 'Localhost 8546',
            css: 'p',
          });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          const chainIdAfterManualSwitch = await driver.executeScript(
            `return window.ethereum.request(${chainIdRequest})`,
          );
          // after connecting the dapp should now have its own selected network
          // independent from the globally selected and therefore should not have changed when
          // the globally selected network was manually changed via the wallet UI
          assert.equal(chainIdAfterManualSwitch, '0x539'); // 1337
        },
      );
    });
  });
});
