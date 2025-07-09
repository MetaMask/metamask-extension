import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { DAPP_HOST_ADDRESS } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Permissions', function (this: Suite) {
  it('sets permissions and connect to Dapp', async function () {
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

        // open permissions page and check that the dapp is connected
        await new HeaderNavbar(driver).openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.check_connectedToSite(DAPP_HOST_ADDRESS);
        await permissionListPage.check_numberOfConnectedSites();

        // can get accounts within the dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.check_getAccountsResult(publicAddress);
      },
    );
  });
});
