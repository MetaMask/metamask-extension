import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { withMultiSRP } from './common-multi-srp';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';

describe('Multi SRP - Add accounts', function (this: Suite) {
  it('adds a new account for the default srp', async function () {
    await withMultiSRP(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          srpIndex: 1,
        });

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_currentAccountIsSRPAccount(1);
      },
    );
  });

  it('adds a new account for the new srp', async function () {
    await withMultiSRP(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          srpIndex: 2,
        });

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_currentAccountIsSRPAccount(2);
      },
    );
  });
});
