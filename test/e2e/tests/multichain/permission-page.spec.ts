import { DAPP_HOST_ADDRESS } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import GatorPermissionsPage from '../../page-objects/pages/permission/gator-permissions-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';

describe('Permissions Page', function () {
  it('should redirect users to connections page when users click on connected permission', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();

        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        await new SitePermissionPage(driver).checkPageIsLoaded(
          DAPP_HOST_ADDRESS,
        );
      },
    );
  });

  it('should navigate back through Gator Permissions page to home route', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        const gatorPermissionsPage = new GatorPermissionsPage(driver);
        const homePage = new HomePage(driver);
        await permissionListPage.checkPageIsLoaded();

        // Click back from Permissions Page - goes to Gator Permissions Page
        await permissionListPage.clickBackButton();
        await gatorPermissionsPage.checkPageIsLoaded();

        // Click back from Gator Permissions Page - goes to Home
        await gatorPermissionsPage.clickBackButton();
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
