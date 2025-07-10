import { Suite } from 'mocha';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { AccountType, withMultichainAccountsDesignEnabled } from './common';

describe('Multichain Accounts - Account tree', function (this: Suite) {
  it('should display basic wallets and accounts', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.check_walletDisplayedInAccountListMenu(
          'Wallet 1',
        );
        await accountListPage.check_walletDisplayedInAccountListMenu(
          'Wallet 2',
        );
        await accountListPage.check_walletDetailsButtonIsDisplayed();

        // Ensure that accounts within the wallets are displayed
        await accountListPage.check_accountAddressDisplayedInAccountList(
          '0x5CfE7...6a7e1',
        );
        await accountListPage.check_accountAddressDisplayedInAccountList(
          '0xc6D5a...874bf',
        );
        await accountListPage.check_accountBalanceDisplayed('$42,500.00');
        await accountListPage.check_accountBalanceDisplayed('$0.00');
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList('Account 2');
        await accountListPage.check_numberOfAvailableAccounts(2);
      },
    );
  });

  it('should display wallet and accounts for hardware wallet', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        accountType: AccountType.HardwareWallet,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.check_walletDisplayedInAccountListMenu(
          'Wallet 1',
        );
        await accountListPage.check_walletDisplayedInAccountListMenu('Ledger');
        await accountListPage.check_walletDetailsButtonIsDisplayed();

        // Ensure that accounts within the wallets are displayed
        await accountListPage.check_accountAddressDisplayedInAccountList(
          '0x5CfE7...6a7e1',
        );
        await accountListPage.check_accountAddressDisplayedInAccountList(
          '0xF6846...8223c',
        );
        await accountListPage.check_accountBalanceDisplayed('$42,500.00');
        await accountListPage.check_accountBalanceDisplayed('$0.00');
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList('Ledger 1');
        await accountListPage.check_numberOfAvailableAccounts(2);
      },
    );
  });
});
