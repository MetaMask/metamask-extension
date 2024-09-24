import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Account list - hide/unhide functionality', function (this: Suite) {
  it('hide and unhide account by clicking hide and unhide button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        new HeaderNavbar(driver).openAccountMenu();

        // hide account
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.hideAccount();
        await accountListPage.check_hiddenAccountsListExists();

        // unhide account
        await accountListPage.openHiddenAccountsList();
        await accountListPage.openHiddenAccountOptions();
        await accountListPage.unhideAccount();
        await accountListPage.check_accountDisplayedInAccountList();
      },
    );
  });
});
