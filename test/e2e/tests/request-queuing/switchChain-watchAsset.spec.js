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
          .withPreferencesControllerUseRequestQueueEnabled()
          .withPermissionControllerConnectedToTestDapp()
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

        await openDapp(driver, contractAddress);

        // Switch Ethereum Chain
        await driver.clickElement('#switchEthereumChain');

        await driver.waitUntilXWindowHandles(3);

        await switchToNotificationWindow(driver);
        await driver.findElement({
          text: 'Allow this site to switch the network?',
          tag: 'h3',
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
          text: 'Switch network',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
