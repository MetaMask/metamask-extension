import { Suite } from 'mocha';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { DAPP_PATH } from '../../constants';
import { WINDOW_TITLES } from '../../helpers';
import { AccountType, withMultichainAccountsDesignEnabled } from './common';

describe('Multichain Accounts - Multichain accounts list page', function (this: Suite) {
  it('displays wallet and accounts for hardware wallet', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        accountType: AccountType.HardwareWallet,
        state: 2,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');

        // Ensure that accounts within the wallets are displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkMultichainAccountNameDisplayed('Account 1');
        await accountListPage.checkMultichainAccountNameDisplayed('Ledger 1');
      },
    );
  });

  it('displays wallet for Snap Keyring', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        accountType: AccountType.SSK,
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        testSpecificMock: async (mockServer) => {
          return mockSnapSimpleKeyringAndSite(mockServer);
        },
        state: 2,
      },
      async (driver: Driver) => {
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const accountListPage = new AccountListPage(driver);

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );

        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkMultichainAccountNameDisplayed('Account 1');
        await accountListPage.checkMultichainAccountNameDisplayed(
          'Snap Account 1',
        );
      },
    );
  });
});
