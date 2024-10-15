const {
  generateGanacheOptions,
  withFixtures,
  openDapp,
  WINDOW_TITLES,
  logInWithBalanceValidation,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Chain Interactions', function () {
  const port = 8546;
  const chainId = 1338;
  const ganacheOptions = generateGanacheOptions({
    concurrent: [{ port, chainId }],
  });

  it('should add the Ganache chain and switch the network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await logInWithBalanceValidation(driver);

        // trigger add chain confirmation
        await openDapp(driver);
        await driver.clickElement('#addEthereumChain');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // approve and switch chain
        await driver.clickElement({ text: 'Approve', tag: 'button' });

        // switch to extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // verify current network
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: `Localhost ${port}`,
        });
      },
    );
  });
});
