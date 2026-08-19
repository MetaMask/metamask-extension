import {
  DAPP_HOST_ADDRESS,
  DEFAULT_FIXTURE_ACCOUNT,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import { getEditConnectedAccountsPageForHost } from '../../page-objects/flows/permissions.flow';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';

const accountLabel1 = 'Account 1';
const accountLabel2 = 'Account 2';
const accountLabel3 = 'Account 3';
describe('Edit Accounts Permissions', function () {
  it('should be able to edit accounts', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await connectAccountToTestDapp(driver, {
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
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(accountLabel2);
        await accountListPage.selectAccount(accountLabel2);

        // ensure non EVM accounts are loaded for Account 2
        const homepage = new Homepage(driver);
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.waitForNonEvmAccountsLoaded();

        // create third account with custom label
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(accountLabel3);
        await accountListPage.selectAccount(accountLabel3);

        // ensure non EVM accounts are loaded for Account 3
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.waitForNonEvmAccountsLoaded();

        // select back Account 1
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.selectAccount(accountLabel1);

        // go to the site's connections permissions page
        const editConnectedAccountsPage =
          await getEditConnectedAccountsPageForHost(driver, DAPP_HOST_ADDRESS);
        await editConnectedAccountsPage.editPermissionsForAccount([
          accountLabel2,
          accountLabel3,
        ]);

        // Saving lands back on the permissions list; re-open the site's
        // permissions and verify all three accounts are now selected in the
        // accounts editor
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        await editConnectedAccountsPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);
        await editConnectedAccountsPage.checkSelectedAccountsNumber(3);
        await editConnectedAccountsPage.checkAccountsAreSelected([
          accountLabel1,
          accountLabel2,
          accountLabel3,
        ]);
      },
    );
  });
});
