import { Suite } from 'mocha';
import {
  multipleGanacheOptions,
  PRIVATE_KEY_TWO,
  tempToggleSettingRedesignedTransactionConfirmations,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  sendRedesignedTransactionWithSnapAccount,
  sendTransactionWithSnapAccount,
} from '../../page-objects/flows/send-transaction.flow';

describe('Snap Account Transfers @no-mmi', function (this: Suite) {
  // TODO: Remove the old confirmations screen tests once migration has been complete.
  // See: https://github.com/MetaMask/MetaMask-planning/issues/3030
  describe('Old confirmation screens', function () {
    it('can import a private key and transfer 1 ETH (sync flow)', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: multipleGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          ganacheServer,
        }: {
          driver: Driver;
          ganacheServer?: Ganache;
        }) => {
          await loginWithBalanceValidation(driver, ganacheServer);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          await installSnapSimpleKeyring(driver);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

          // import snap account with private key on snap simple keyring page.
          await snapSimpleKeyringPage.importAccountWithPrivateKey(
            PRIVATE_KEY_TWO,
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_accountLabel('SSK Account');

          // send 1 ETH from snap account to account 1
          await sendTransactionWithSnapAccount({
            driver,
            recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
            amount: '1',
            gasFee: '0.000042',
            totalFee: '1.000042',
          });
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.openAccountMenu();
          const accountList = new AccountListPage(driver);
          await accountList.check_pageIsLoaded();

          // check the balance of the 2 accounts are updated
          await accountList.check_accountBalanceDisplayed('26');
          await accountList.check_accountBalanceDisplayed('24');
        },
      );
    });

    it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: multipleGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          ganacheServer,
        }: {
          driver: Driver;
          ganacheServer?: Ganache;
        }) => {
          await loginWithBalanceValidation(driver, ganacheServer);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          await installSnapSimpleKeyring(driver, false);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

          // import snap account with private key on snap simple keyring page.
          await snapSimpleKeyringPage.importAccountWithPrivateKey(
            PRIVATE_KEY_TWO,
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_accountLabel('SSK Account');

          // send 1 ETH from snap account to account 1 and approve the transaction
          await sendTransactionWithSnapAccount({
            driver,
            recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
            amount: '1',
            gasFee: '0.000042',
            totalFee: '1.000042',
            isSyncFlow: false,
          });
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.openAccountMenu();
          const accountList = new AccountListPage(driver);
          await accountList.check_pageIsLoaded();

          // check the balance of the 2 accounts are updated
          await accountList.check_accountBalanceDisplayed('26');
          await accountList.check_accountBalanceDisplayed('24');
        },
      );
    });

    it('can import a private key and transfer 1 ETH (async flow reject)', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: multipleGanacheOptions,
          title: this.test?.fullTitle(),
          ignoredConsoleErrors: ['Request rejected by user or snap.'],
        },
        async ({
          driver,
          ganacheServer,
        }: {
          driver: Driver;
          ganacheServer?: Ganache;
        }) => {
          await loginWithBalanceValidation(driver, ganacheServer);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          await installSnapSimpleKeyring(driver, false);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

          // Import snap account with private key on snap simple keyring page.
          await snapSimpleKeyringPage.importAccountWithPrivateKey(
            PRIVATE_KEY_TWO,
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_accountLabel('SSK Account');

          // send 1 ETH from snap account to account 1 and reject the transaction
          await sendTransactionWithSnapAccount({
            driver,
            recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
            amount: '1',
            gasFee: '0.000042',
            totalFee: '1.000042',
            isSyncFlow: false,
            approveTransaction: false,
          });

          // check the transaction is failed in MetaMask activity list
          const homepage = new HomePage(driver);
          await homepage.check_pageIsLoaded();
          await homepage.check_failedTxNumberDisplayedInActivity();
        },
      );
    });
  });

  describe('Redesigned confirmation screens', function () {
    it('can import a private key and transfer 1 ETH (sync flow)', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: multipleGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          ganacheServer,
        }: {
          driver: Driver;
          ganacheServer?: Ganache;
        }) => {
          await loginWithBalanceValidation(driver, ganacheServer);

          await installSnapSimpleKeyring(driver);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

          // import snap account with private key on snap simple keyring page.
          await snapSimpleKeyringPage.importAccountWithPrivateKey(
            PRIVATE_KEY_TWO,
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_accountLabel('SSK Account');

          // send 1 ETH from snap account to account 1
          await sendRedesignedTransactionWithSnapAccount({
            driver,
            recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
            amount: '1',
          });
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.openAccountMenu();
          const accountList = new AccountListPage(driver);
          await accountList.check_pageIsLoaded();

          // check the balance of the 2 accounts are updated
          await accountList.check_accountBalanceDisplayed('26');
          await accountList.check_accountBalanceDisplayed('24');
        },
      );
    });

    it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: multipleGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          ganacheServer,
        }: {
          driver: Driver;
          ganacheServer?: Ganache;
        }) => {
          await loginWithBalanceValidation(driver, ganacheServer);

          await installSnapSimpleKeyring(driver, false);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

          // import snap account with private key on snap simple keyring page.
          await snapSimpleKeyringPage.importAccountWithPrivateKey(
            PRIVATE_KEY_TWO,
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_accountLabel('SSK Account');

          // send 1 ETH from snap account to account 1 and approve the transaction
          await sendRedesignedTransactionWithSnapAccount({
            driver,
            recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
            amount: '1',
            isSyncFlow: false,
          });
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.openAccountMenu();
          const accountList = new AccountListPage(driver);
          await accountList.check_pageIsLoaded();

          // check the balance of the 2 accounts are updated
          await accountList.check_accountBalanceDisplayed('26');
          await accountList.check_accountBalanceDisplayed('24');
        },
      );
    });

    it('can import a private key and transfer 1 ETH (async flow reject)', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: multipleGanacheOptions,
          title: this.test?.fullTitle(),
          ignoredConsoleErrors: ['Request rejected by user or snap.'],
        },
        async ({
          driver,
          ganacheServer,
        }: {
          driver: Driver;
          ganacheServer?: Ganache;
        }) => {
          await loginWithBalanceValidation(driver, ganacheServer);

          await installSnapSimpleKeyring(driver, false);
          const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

          // Import snap account with private key on snap simple keyring page.
          await snapSimpleKeyringPage.importAccountWithPrivateKey(
            PRIVATE_KEY_TWO,
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_accountLabel('SSK Account');

          // send 1 ETH from snap account to account 1 and reject the transaction
          await sendRedesignedTransactionWithSnapAccount({
            driver,
            recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
            amount: '1',
            isSyncFlow: false,
            approveTransaction: false,
          });

          // check the transaction is failed in MetaMask activity list
          const homepage = new HomePage(driver);
          await homepage.check_pageIsLoaded();
          await homepage.check_failedTxNumberDisplayedInActivity();
        },
      );
    });
  });
});
