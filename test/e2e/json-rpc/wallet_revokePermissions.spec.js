const { strict: assert } = require('assert');

const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  openDapp,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Revoke Dapp Permissions', function () {
  it('should revoke dapp permissions ', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);

        await driver.findElement({
          text: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          css: '#accounts',
        });

        // wallet_revokePermissions request
        const revokePermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });

        const result = await driver.executeScript(
          `return window.ethereum.request(${revokePermissionsRequest})`,
        );

        // Response of method call
        assert.deepEqual(result, null);

        // TODO: Fix having to reload dapp as it is not the proper behavior in production, issue with test setup.
        await driver.executeScript(`window.location.reload()`);

        // You cannot use driver.findElement() with an empty string, so use xpath
        await driver.findElement({ xpath: '//span[@id="accounts"][.=""]' });
      },
    );
  });
});
