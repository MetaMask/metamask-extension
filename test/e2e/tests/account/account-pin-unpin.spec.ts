import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Account list - pin/unpin functionality', function (this: Suite) {
  it('pin and unpin account by clicking the pin/unpin button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        new HeaderNavbar(driver).openAccountMenu();

        // pin account
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.pinAccount();
        await accountListPage.check_accountIsPinned();

        // unpin account
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.unpinAccount();
        await accountListPage.check_accountIsUnpinned();
      },
    );
  });

  it('account once hidden should be unpinned and remain so even if revealed again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        new HeaderNavbar(driver).openAccountMenu();

        // pin account
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.pinAccount();
        await accountListPage.check_accountIsPinned();

        // hide the same account and check the account is unpinned automatically
        await accountListPage.openAccountOptionsMenu();
        await accountListPage.hideAccount();
        await accountListPage.check_hiddenAccountsListExists();
        await accountListPage.check_accountIsUnpinned();

        // unhide the same account and check the account is still unpinned
        await accountListPage.openHiddenAccountsList();
        await accountListPage.openHiddenAccountOptions();
        await accountListPage.unhideAccount();
        await accountListPage.check_accountDisplayedInAccountList();
        await accountListPage.check_accountIsUnpinned();
      },
    );
  });
});
