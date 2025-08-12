import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import {
  ACCOUNT_TYPE,
  DEFAULT_FIXTURE_ACCOUNT,
  DAPP_HOST_ADDRESS,
} from '../../constants';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const accountLabel2 = '2nd custom name';
const accountLabel3 = '3rd custom name';
describe('Edit Accounts Permissions', function () {
  it('should be able to edit accounts', async function () {
    await withFixtures(
      {
        dapp: true,
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
        new HeaderNavbar(driver).openAccountMenu();

        // create second account with custom label
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName: accountLabel2,
        });
        const homepage = new Homepage(driver);
        await homepage.checkExpectedBalanceIsDisplayed();

        // create third account with custom label
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName: accountLabel3,
        });
        await homepage.checkExpectedBalanceIsDisplayed();

        // go to connections permissions page
        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);
        await sitePermissionPage.editPermissionsForAccount([
          accountLabel2,
          accountLabel3,
        ]);
        await sitePermissionPage.checkConnectedAccountsNumber(3);
      },
    );
  });
});
