import { Suite } from 'mocha';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { withMultichainAccountsDesignEnabled } from './common';

const account1 = {
  name: 'Account 1',
  address: '0x1234567890123456789012345678901234567890',
};

describe('Multichain Accounts - Edit Account', function (this: Suite) {
  it('should be able to edit an account', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.openAccountDetailsModal(account1.name);
        await driver.delay(1000000);
      },
    );
  });
});
