const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  regularDelayMs,
  defaultGanacheOptions,
  WINDOW_TITLES,
  largeDelayMs,
} = require('../../helpers');

describe('Request Queuing Dapp 1, Switch Tx -> Dapp 2 Send Tx', function () {
  it('should queue signTypedData tx after eth_sendTransaction confirmation and signTypedData confirmation should target the correct network after eth_sendTransaction is confirmed @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
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

        // Open and connect Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        // Open and connect to Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // Switch Dapp Two to Localhost 8546
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        let switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on Dapp one
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.waitForSelector({
          css: '[id="chainId"]',
          text: '0x53a',
        });

        // Should auto switch without prompt since already approved via connect

        // Switch back to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);

        // switch chain for Dapp One
        switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e8' }],
        });

        // Initiate switchEthereumChain on Dapp one
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await driver.waitForSelector({
          css: '[id="chainId"]',
          text: '0x3e8',
        });
        // Should auto switch without prompt since already approved via connect

        await driver.switchToWindowWithUrl(DAPP_URL);

        // eth_sendTransaction request
        await driver.clickElement('#sendButton');
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        // signTypedData request
        await driver.clickElement('#signTypedData');

        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        await driver.waitForSelector({
          css: 'p',
          text: 'Localhost 7777',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.delay(largeDelayMs);
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the signTypedData confirmation.
        await driver.waitForSelector({
          css: 'p',
          text: 'Localhost 8546',
        });

        await driver.clickElement({ text: 'Cancel', tag: 'button' });
      },
    );
  });
});
