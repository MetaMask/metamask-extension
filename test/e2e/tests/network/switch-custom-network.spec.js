const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  generateGanacheOptions,
} = require('../../helpers');

describe('Switch ethereum chain', function () {
  it('should successfully change the network in response to wallet_switchEthereumChain', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: [
            {
              port: 8546,
              chainId: 1338,
              ganacheOptions2: {},
            },
          ],
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);

        await driver.clickElement({
          tag: 'button',
          text: 'Add Localhost 8546',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          tag: 'button',
          text: 'Approve',
        });

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8546',
        });
      },
    );
  });
});
