const FixtureBuilder = require('../../fixture-builder');
const {
  DAPP_ONE_URL,
  DAPP_URL,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  veryLargeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} = require('../../helpers');

describe('Request Queuing Dapp 1, Switch Tx -> Dapp 2 Send Tx', function () {
  it('should queue send tx after switch network confirmation and transaction should target the correct network after switch is confirmed', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
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
            {
              port: 7777,
              chainId: 1000,
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

        // Connect to dapp
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.clickElementAndWaitForWindowToClose({
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

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // Connect to dapp 2
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.switchToWindowWithUrl(DAPP_URL);

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e8' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        await driver.clickElement('#sendButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const windowsBefore = await driver.getAllWindowHandles();

        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // Wait for switch confirmation to close then tx confirmation to show.
        await driver.waitForNotificationToCloseAndOpen({
          driver,
          windowsBefore,
        });

        // For Firefox/Webpack, there is an extra window appearing and disapearing
        // so we leave this delay until the issue is fixed (#27360)
        if (process.env.SELENIUM_BROWSER !== 'chrome') {
          await driver.delay(veryLargeDelayMs);
        }

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8546',
        });

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
        });

        // Switch back to the extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );

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

  it('should queue send tx after switch network confirmation and transaction should target the correct network after switch is cancelled.', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
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
            {
              port: 7777,
              chainId: 1000,
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

        // Connect to dapp
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.clickElementAndWaitForWindowToClose({
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

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // Connect to dapp 2
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.switchToWindowWithUrl(DAPP_URL);

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e8' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        await driver.clickElement('#sendButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const windowsBefore = await driver.getAllWindowHandles();

        await driver.clickElement({ text: 'Cancel', tag: 'button' });

        // Wait for switch confirmation to close then tx confirmation to show.
        await driver.waitForNotificationToCloseAndOpen({
          driver,
          windowsBefore,
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8546',
        });

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
        });

        // Switch back to the extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );

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
