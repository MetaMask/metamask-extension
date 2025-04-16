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
  largeDelayMs,
} = require('../../helpers');

describe('Request Queuing for Multiple Dapps and Txs on same networks', function () {
  it('should put confirmation txs for different dapps on same networks in same queue', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .build(),
        dappOptions: { numberOfDapps: 3 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
          {
            type: 'anvil',
            options: {
              port: 7777,
              chainId: 1000,
            },
          },
        ],
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp 1
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithUrl(DAPP_URL);

        let switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e8' }],
        });

        // Ensure Dapp One is on Localhost 7777
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Should auto switch without prompt since already approved via connect

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Wait for the first dapp's connect confirmation to disappear
        await driver.waitUntilXWindowHandles(2);

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // Connect to dapp 2
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Ensure Dapp Two is on Localhost 8545
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Should auto switch without prompt since already approved via connect

        // Dapp one send two tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.delay(largeDelayMs);
        await driver.clickElement('#sendButton');
        await driver.clickElement('#sendButton');

        await driver.delay(largeDelayMs);

        // Dapp two send two tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await driver.delay(largeDelayMs);
        await driver.clickElement('#sendButton');
        await driver.clickElement('#sendButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector(
          By.xpath("//p[normalize-space(.)='1 of 4']"),
        );

        // Check correct network on confirm tx.
        await driver.findElement({
          css: 'p',
          text: 'Localhost 7777',
        });

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );
        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Check correct network on confirm tx.
        await driver.findElement({
          css: 'p',
          text: 'Localhost 8546',
        });

        // Reject All Transactions
        await driver.clickElement({ text: 'Reject all', tag: 'button' });

        // Wait for confirmation to close
        await driver.waitUntilXWindowHandles(3);
      },
    );
  });
});
