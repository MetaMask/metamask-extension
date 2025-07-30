import { Suite } from 'mocha';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { mockSimpleKeyringSnap } from '../../mock-response-data/snaps/snap-binary-mocks';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { WINDOW_TITLES } from '../../helpers';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import {
  AccountType,
  mockMultichainAccountsFeatureFlag,
  withMultichainAccountsDesignEnabled,
} from './common';

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

  it('should display wallet for Snap Keyring', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        accountType: AccountType.SSK,
        testSpecificMock: async (mockServer) => {
          await mockSimpleKeyringSnap(mockServer);
          return mockMultichainAccountsFeatureFlag(mockServer);
        },
      },
      async (driver: Driver) => {
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.check_walletDisplayedInAccountListMenu(
          'Wallet 1',
        );
        await accountListPage.check_walletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );
        await accountListPage.check_walletDetailsButtonIsDisplayed();

        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.check_accountBalanceDisplayed('$42,500.00');
        await accountListPage.check_accountBalanceDisplayed('$0.00');
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList(
          'SSK Account',
        );
        await accountListPage.check_numberOfAvailableAccounts(3);
      },
    );
  });
});
