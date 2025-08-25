import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Account list - hide/unhide functionality', function (this: Suite) {
  it('hide and unhide account by clicking hide and unhide button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        new HeaderNavbar(driver).openAccountMenu();

        // hide account
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.hideAccount();
        await accountListPage.checkHiddenAccountsListExists();

        // unhide account
        await accountListPage.openHiddenAccountsList();
        await accountListPage.openHiddenAccountOptions();
        await accountListPage.unhideAccount();
        await accountListPage.checkAccountDisplayedInAccountList();
      },
    );
  });
});
