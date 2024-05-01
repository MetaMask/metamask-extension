const { strict: assert } = require('assert');
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
          concurrent: {
            port: 8546,
            chainId: 1338,
            ganacheOptions2: {},
          },
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        await openDapp(driver);

        await driver.clickElement({
          tag: 'button',
          text: 'Add Localhost 8546',
        });

        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Approve',
        });

        await driver.findElement({
          tag: 'h3',
          text: 'Allow this site to switch the network?',
        });

        // Don't switch to network now, because we will click the 'Switch to Localhost 8546' button below
        await driver.clickElement({
          tag: 'button',
          text: 'Cancel',
        });

        await driver.waitUntilXWindowHandles(2);

        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement({
          tag: 'button',
          text: 'Switch to Localhost 8546',
        });

        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.clickElement({
          tag: 'button',
          text: 'Switch network',
        });

        await driver.waitUntilXWindowHandles(2);

        await driver.switchToWindow(extension);

        const currentNetworkName = await driver.findElement({
          tag: 'span',
          text: 'Localhost 8546',
        });

        assert.ok(
          Boolean(currentNetworkName),
          'Failed to switch to custom network',
        );
      },
    );
  });
});
