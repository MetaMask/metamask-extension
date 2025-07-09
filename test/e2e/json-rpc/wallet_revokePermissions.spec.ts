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
          .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
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
          .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

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
          .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
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

  describe('There are pending confirmation in the old network', function () {
    it('rejects the pending confirmations as permissions are revoked for the network', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();
          await testDapp.clickPersonalSign();

          const revokePermissionsRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'wallet_revokePermissions',
            params: [
              {
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                eth_accounts: {},
              },
            ],
          });

          const revokePermissionsResult = await driver.executeScript(
            `return window.ethereum.request(${revokePermissionsRequest})`,
          );
          assert.deepEqual(revokePermissionsResult, null);

          await driver.waitUntilXWindowHandles(2);

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
});
