import { DAPP_HOST_ADDRESS } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Permissions Page', function () {
  it('should redirect users to connections page when users click on connected permission', async function () {
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
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.closeNotificationModal();

        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        await new SitePermissionPage(driver).check_pageIsLoaded(
          DAPP_HOST_ADDRESS,
        );
      },
    );
  });
});
