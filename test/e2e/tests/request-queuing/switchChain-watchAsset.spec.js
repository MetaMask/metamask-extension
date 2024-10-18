const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  openDapp,
  switchToNotificationWindow,
  WINDOW_TITLES,
  withFixtures,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const { DAPP_URL } = require('../../constants');

describe('Request Queue SwitchChain -> WatchAsset', function () {
  const smartContract = SMART_CONTRACTS.HST;
  it('should clear subsequent watchAsset after switching chain', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
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
        smartContract,
        title: this.test.fullTitle(),
      },

      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        await openDapp(driver, contractAddress, DAPP_URL);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findElement({
          text: 'Use your enabled networks',
          tag: 'p',
        });

        // Switch back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Watch Asset
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        await switchToNotificationWindow(driver);

        // Confirm Switch Network
        await driver.findClickableElement({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
