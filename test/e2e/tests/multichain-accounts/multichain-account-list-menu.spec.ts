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
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 2');
        await accountListPage.checkWalletDetailsButtonIsDisplayed();

        // Ensure that accounts within the wallets are displayed
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          '0x5CfE7...6a7e1',
        );
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          '0xc6D5a...874bf',
        );
        await accountListPage.checkAccountBalanceDisplayed('$42,500.00');
        await accountListPage.checkAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Account 2');
        await accountListPage.checkNumberOfAvailableAccounts(2);
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
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');
        await accountListPage.checkWalletDetailsButtonIsDisplayed();

        // Ensure that accounts within the wallets are displayed
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          '0x5CfE7...6a7e1',
        );
        await accountListPage.checkAccountAddressDisplayedInAccountList(
          '0xF6846...8223c',
        );
        await accountListPage.checkAccountBalanceDisplayed('$42,500.00');
        await accountListPage.checkAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Ledger 1');
        await accountListPage.checkNumberOfAvailableAccounts(2);
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
        await headerNavbar.checkAccountLabel('SSK Account');

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );
        await accountListPage.checkWalletDetailsButtonIsDisplayed();

        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.checkAccountBalanceDisplayed('$42,500.00');
        await accountListPage.checkAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('SSK Account');
        await accountListPage.checkNumberOfAvailableAccounts(3);
      },
    );
  });
});
