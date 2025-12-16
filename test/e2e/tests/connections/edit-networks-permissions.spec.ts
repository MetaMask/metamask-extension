import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { DEFAULT_FIXTURE_ACCOUNT, DAPP_HOST_ADDRESS } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Edit Networks Permissions', function () {
  it('should be able to edit networks', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new Homepage(driver).checkPageIsLoaded();

        // Open permission page for dapp
        new HeaderNavbar(driver).openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);

        // Disconnect Mainnet
        await sitePermissionPage.editPermissionsForNetwork(['Ethereum']);

        // Default Chains Connected: Ethereum, Linea, Base, Arbitrum, BSC, Optimism, Polygon
        await sitePermissionPage.checkConnectedNetworksNumber(8);
      },
    );
  });
});
