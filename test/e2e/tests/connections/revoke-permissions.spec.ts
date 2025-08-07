import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { DAPP_HOST_ADDRESS, DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Revoke Permissions', function () {
  it('should disconnect when click on Disconnect button in connections page', async function () {
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

        // open permission page
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);

        // click connect button to revoke permission
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);
        await sitePermissionPage.disconnectAll();

        // Switch to Dapp and check the dapp is disconnected
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT, false);
      },
    );
  });
});
