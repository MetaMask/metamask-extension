import { strict as assert } from 'assert';
import { PermissionConstraint } from '@metamask/permission-controller';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import TestDapp from '../page-objects/pages/test-dapp';
import { Driver } from '../webdriver/driver';

describe('wallet_getPermissions', function () {
  it('returns permissions when the wallet is unlocked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.title,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

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

  it('returns permissions when the wallet is locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.title,
      },
      async ({ driver }: { driver: Driver }) => {
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

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
