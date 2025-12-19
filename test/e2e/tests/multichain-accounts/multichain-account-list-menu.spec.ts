import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { DAPP_PATH } from '../../constants';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { mockPriceApi } from '../tokens/utils/mocks';
import { AccountType, withMultichainAccountsDesignEnabled } from './common';

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
        await accountListPage.checkAddWalletButttonIsDisplayed();

        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$85,025.00',
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Account 2');
        await accountListPage.checkNumberOfAvailableAccounts(2);
      },
    );
  });
  it('should display wallet and accounts for hardware wallet', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withLedgerAccount()
          .withShowFiatTestnetEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withConversionRateEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockSnapSimpleKeyringAndSite(mockServer);
          return [await mockPriceApi(mockServer)];
        },
      },
      async ({ driver, localNodes }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x15af1d78b58c40000',
        )) ?? console.error('localNodes is undefined or empty');
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');
        await accountListPage.checkAddWalletButttonIsDisplayed();

        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$85,025.00',
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
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
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        testSpecificMock: async (mockServer) => {
          return mockSnapSimpleKeyringAndSite(mockServer);
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
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );
        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$85,025.00',
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList(
          'Snap Account 1',
        );
        await accountListPage.checkNumberOfAvailableAccounts(3);
      },
    );
  });
});
