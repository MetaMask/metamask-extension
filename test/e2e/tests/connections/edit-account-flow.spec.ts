import { strict as assert } from 'assert';
import {
  withFixtures,
  WINDOW_TITLES,
  connectToDapp,
  logInWithBalanceValidation,
  locateAccountBalanceDOM,
  defaultGanacheOptions
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { DAPP_HOST_ADDRESS } from '../../constants';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const accountLabel2 = '2nd custom name';
const accountLabel3 = '3rd custom name';
describe('Edit Accounts Flow', function () {
  it('should be able to edit accounts', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .build(),
        title: this.test?.fullTitle(),
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        testdapp.connectToDapp(driver);
        new HeaderNavbar(driver).openAccountMenu();

        // create second account with custom label
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewAccount(accountLabel2);
        const homepage = new Homepage(driver);
        await homepage.check_expectedBalanceIsDisplayed();

        // create third account with custom label
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewAccount(accountLabel3);
        await homepage.check_expectedBalanceIsDisplayed();

        // go to connections permissions page
        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);

        await sitePermissionPage.editPermissionsForAccount([accountLabel2, accountLabel3]);

        const updatedAccountInfo = await driver.isElementPresent({
          text: '3 accounts connected',
          tag: 'span',
        });
        assert.ok(updatedAccountInfo, 'Accounts List Updated');
      },
    );
  });
});
