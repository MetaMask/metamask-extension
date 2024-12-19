import { strict as assert } from 'assert';
import { ACCOUNT_1, withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('Revoke Dapp Permissions', function () {
  it('should revoke dapp permissions ', async function () {
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
        await testDapp.check_connectedAccounts(ACCOUNT_1);

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

        await testDapp.check_connectedAccounts(ACCOUNT_1, false);
      },
    );
  });
});
