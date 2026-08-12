import { strict as assert } from 'assert';
import { DAPP_HOST_ADDRESS } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { openPermissionsPageFlow } from '../../page-objects/flows/permissions.flow';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import GatorPermissionsPage from '../../page-objects/pages/permission/gator-permissions-page';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';

describe('Permissions Page', function () {
  it('should redirect users to connections page when users click on connected permission', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        await openPermissionsPageFlow(driver);
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();

        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        await new SitePermissionPage(driver).checkPageIsLoaded(
          DAPP_HOST_ADDRESS,
        );
      },
    );
  });

  it('should navigate back from Permissions page to home route', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        await openPermissionsPageFlow(driver);

        const permissionListPage = new PermissionListPage(driver);
        const homePage = new HomePage(driver);
        await permissionListPage.checkPageIsLoaded();

        // Click back from Permissions Page - goes directly to Home
        // (When only dapp connections exist without gator permissions,
        // the Gator Permissions page auto-redirects, so back goes to Home)
        await permissionListPage.clickBackButton();
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('should display Gator Permissions page with both Connections and Token transfer sections', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withGatorPermissionsConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

        // Open permissions via global menu - should land on Gator Permissions page
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.clickAllPermissionsButton();

        // Verify Gator Permissions page is displayed (not auto-redirected)
        const gatorPermissionsPage = new GatorPermissionsPage(driver);
        await gatorPermissionsPage.checkPageIsLoaded();

        // Verify both sections are present
        const hasConnections =
          await gatorPermissionsPage.isConnectionsButtonPresent();
        const hasAssets = await gatorPermissionsPage.isAssetsButtonPresent();

        assert.strictEqual(
          hasConnections,
          true,
          'Connections section should be visible',
        );
        assert.strictEqual(
          hasAssets,
          true,
          'Token transfer section should be visible',
        );

        // Verify clicking Connections navigates to Permissions page
        await gatorPermissionsPage.clickSites();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();

        // Navigate back to Gator Permissions page
        await permissionListPage.clickBackButton();
        await gatorPermissionsPage.checkPageIsLoaded();

        // Navigate back to Home
        await gatorPermissionsPage.clickBackButton();
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
