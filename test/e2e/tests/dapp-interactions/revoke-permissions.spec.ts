import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Wallet Revoke Permissions', function (this: Suite) {
  it('should revoke "eth_accounts" permissions via test dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        const addresses = await localNodes[0].getAccounts();
        const publicAddress = addresses[0].toLowerCase();
        await loginWithBalanceValidation(driver);

        // Get initial accounts permissions
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.check_getPermissionsResult('eth_accounts');

        // Revoke eth_accounts permissions and check that the permission is removed
        await testDapp.disconnectAccount(publicAddress);
        await testDapp.check_getPermissionsResult('No permissions found.');
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // Get initial accounts permissions
        await testDapp.check_getPermissionsResult('eth_accounts');

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

        // Get new allowed permissions and check that the permission is removed
        await testDapp.check_getPermissionsResult('No permissions found.');
      },
    );
  });
});
