import { strict as assert } from 'assert';
import { PermissionConstraint } from '@metamask/permission-controller';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('Revoke Dapp Permissions', function () {
  it('should revoke "eth_accounts" and "endowment:permitted-chains" when the dapp revokes permissions for just "eth_accounts"', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChain()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const beforeGetPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getPermissions',
        });
        const beforeGetPermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${beforeGetPermissionsRequest})`,
        );
        const beforeGetPermissionsNames = beforeGetPermissionsResult.map(
          (permission: PermissionConstraint) => permission.parentCapability,
        );
        assert.deepEqual(beforeGetPermissionsNames, [
          'eth_accounts',
          'endowment:permitted-chains',
        ]);

        const revokePermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });
        const revokePermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${revokePermissionsRequest})`,
        );
        assert.deepEqual(revokePermissionsResult, null);

        const afterGetPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getPermissions',
        });
        const afterGetPermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${afterGetPermissionsRequest})`,
        );
        const afterGetPermissionsNames = afterGetPermissionsResult.map(
          (permission: PermissionConstraint) => permission.parentCapability,
        );
        assert.deepEqual(afterGetPermissionsNames, []);
      },
    );
  });

  it('should revoke "eth_accounts" and "endowment:permitted-chains" when the dapp revokes permissions for just "endowment:permitted-chains"', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChain()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const beforeGetPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getPermissions',
        });
        const beforeGetPermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${beforeGetPermissionsRequest})`,
        );
        const beforeGetPermissionsNames = beforeGetPermissionsResult.map(
          (permission: PermissionConstraint) => permission.parentCapability,
        );
        assert.deepEqual(beforeGetPermissionsNames, [
          'eth_accounts',
          'endowment:permitted-chains',
        ]);

        const revokePermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              'endowment:permitted-chains': {},
            },
          ],
        });
        const revokePermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${revokePermissionsRequest})`,
        );
        assert.deepEqual(revokePermissionsResult, null);

        const afterGetPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getPermissions',
        });
        const afterGetPermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${afterGetPermissionsRequest})`,
        );
        const afterGetPermissionsNames = afterGetPermissionsResult.map(
          (permission: PermissionConstraint) => permission.parentCapability,
        );
        assert.deepEqual(afterGetPermissionsNames, []);
      },
    );
  });

  it('should revoke "eth_accounts" and "endowment:permitted-chains" when the dapp revokes permissions for "eth_accounts" and "endowment:permitted-chains"', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChain()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const beforeGetPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getPermissions',
        });
        const beforeGetPermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${beforeGetPermissionsRequest})`,
        );
        const beforeGetPermissionsNames = beforeGetPermissionsResult.map(
          (permission: PermissionConstraint) => permission.parentCapability,
        );
        assert.deepEqual(beforeGetPermissionsNames, [
          'eth_accounts',
          'endowment:permitted-chains',
        ]);

        const revokePermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
              'endowment:permitted-chains': {},
            },
          ],
        });
        const revokePermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${revokePermissionsRequest})`,
        );
        assert.deepEqual(revokePermissionsResult, null);

        const afterGetPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getPermissions',
        });
        const afterGetPermissionsResult = await driver.executeScript(
          `return window.ethereum.request(${afterGetPermissionsRequest})`,
        );
        const afterGetPermissionsNames = afterGetPermissionsResult.map(
          (permission: PermissionConstraint) => permission.parentCapability,
        );
        assert.deepEqual(afterGetPermissionsNames, []);
      },
    );
  });
});
