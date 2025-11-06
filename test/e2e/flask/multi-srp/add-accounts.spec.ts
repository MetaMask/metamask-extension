import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withMultiSrp } from './common-multi-srp';

const addAccountToSrp = async (driver: Driver, srpIndex: number) => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();

  // This will create 'Account 2'.
  await accountListPage.addMultichainAccount({
    srpIndex,
  });

  await accountListPage.closeMultichainAccountsPage();
  await accountListPage.checkAccountBelongsToSrp('Account 2', srpIndex + 1);
};

describe('Multi SRP - Add accounts', function (this: Suite) {
  it('adds a new account for the default srp', async function () {
    await withMultiSrp(async (driver) => {
      await addAccountToSrp(driver, 0);
    });
  });

  it('adds a new account for the new srp', async function () {
    await withMultiSrp(async (driver) => {
      await addAccountToSrp(driver, 1);
    });
  });
});
