import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import { mockActiveNetworks, withMultiSrp } from './common-multi-srp';

const addAccountToSrp = async (driver: Driver, srpIndex: number) => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.check_pageIsLoaded();

  // This will create 'Account 3'.
  await accountListPage.addAccount({
    accountType: ACCOUNT_TYPE.Ethereum,
    srpIndex,
  });
  await accountListPage.check_accountBelongsToSrp('Account 3', srpIndex);
};

describe('Multi SRP - Add accounts', function (this: Suite) {
  it('adds a new account for the default srp', async function () {
    await withMultiSrp(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async (driver: Driver) => {
        await addAccountToSrp(driver, 1);
      },
    );
  });

  it('adds a new account for the new srp', async function () {
    await withMultiSrp(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async (driver: Driver) => {
        await addAccountToSrp(driver, 2);
      },
    );
  });
});
