const {
  withFixtures,
  openDapp,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Wallet Revoke Permissions', function () {
  it('should revoke "eth_accounts" permissions via test dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        // Get initial accounts permissions
        await driver.clickElement('#getPermissions');

        await driver.waitForSelector({
          css: '#permissionsResult',
          text: 'eth_accounts',
        });

        // Revoke eth_accounts permissions
        await driver.clickElement('#revokeAccountsPermission');

        // Get new allowed permissions
        await driver.clickElement('#getPermissions');

        // Eth_accounts permissions removed
        await driver.waitForSelector({
          css: '#permissionsResult',
          text: 'No permissions found.',
        });
      },
    );
  });

  it('should revoke "endowment:permitted-chains" permissions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        // Get initial accounts permissions
        await driver.clickElement('#getPermissions');

        const revokeChainsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              'endowment:permitted-chains': {},
            },
          ],
        });

        await driver.executeScript(
          `return window.ethereum.request(${revokeChainsRequest})`,
        );

        // Get new allowed permissions
        await driver.clickElement('#getPermissions');

        // Eth_accounts permissions removed
        await driver.waitForSelector({
          css: '#permissionsResult',
          text: 'No permissions found.',
        });
      },
    );
  });
});
