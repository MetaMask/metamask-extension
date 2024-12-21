import { strict as assert } from 'assert';
import { PermissionConstraint } from '@metamask/permission-controller';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import TestDapp from '../page-objects/pages/test-dapp';

describe('wallet_requestPermissions', function () {
  it('executes a request permissions on eth_accounts event', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.title,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // wallet_requestPermissions
        const requestPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsRequest})`,
        );

        // confirm connect account
        await testDapp.confirmConnectAccountModal();

        const getPermissionsRequest = JSON.stringify({
          method: 'wallet_getPermissions',
        });
        const getPermissions = await driver.executeScript(
          `return window.ethereum.request(${getPermissionsRequest})`,
        );

        const grantedPermissionNames = getPermissions
          .map(
            (permission: PermissionConstraint) => permission.parentCapability,
          )
          .sort();

        assert.deepStrictEqual(grantedPermissionNames, [
          'endowment:permitted-chains',
          'eth_accounts',
        ]);
      },
    );
  });
});
