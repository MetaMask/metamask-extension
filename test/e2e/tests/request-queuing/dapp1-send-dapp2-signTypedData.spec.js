const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  defaultGanacheOptions,
  tempToggleSettingRedesignedConfirmations,
  WINDOW_TITLES,
} = require('../../helpers');

describe('Request Queuing Dapp 1, Switch Tx -> Dapp 2 Send Tx', function () {
  it('should queue signTypedData tx after eth_sendTransaction confirmation and signTypedData confirmation should target the correct network after eth_sendTransaction is confirmed @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    const chainIdHex = '0x53a';
    const chainIdHexDappOne = '0x3e8';
    const ganachePortDappTwo = 7777;
    const ganacheChainIdDappTwo = 1000;

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
              port: ganachePortDappTwo,
              chainId: ganacheChainIdDappTwo,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedConfirmations(driver);

        // Open and connect Dapp One
        await openDapp(driver, undefined, DAPP_URL);
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');
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
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // Switch Dapp Two to Localhost 8546
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await driver.waitForSelector({
          css: '[id="chainId"]',
          text: chainIdHex,
        });

        // Switch back to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);
        const switchEthereumChainRequestDappOne = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHexDappOne }],
        });

        // Initiate switchEthereumChain on Dapp One
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequestDappOne})`,
        );
        await driver.waitForSelector({
          css: '[id="chainId"]',
          text: chainIdHexDappOne,
        });

        // eth_sendTransaction request
        await driver.clickElement('#sendButton');
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        // signTypedData request
        await driver.clickElement('#signTypedData');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        await driver.waitForSelector({
          css: '[data-testid="network-display"]',
          text: 'Localhost 7777',
        });

        await driver.waitForSelector({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the signTypedData confirmation.
        await driver.waitForSelector({
          css: '[data-testid="signature-request-network-display"]',
          text: 'Localhost 8546',
        });
      },
    );
  });
});
