import { Suite } from 'mocha';
import {
  withFixtures,
  WINDOW_TITLES,
  PRIVATE_KEY_TWO,
  multipleGanacheOptions,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendTransactionWithSnapAccount } from '../../page-objects/flows/send-transaction.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/homepage';

describe('Snap Account Transfers', function (this: Suite) {
  it('can import a private key and transfer 1 ETH (sync flow)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: multipleGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver, true);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(PRIVATE_KEY_TWO);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // send 1 ETH from snap account to account 1
        await sendTransactionWithSnapAccount(
          driver,
          DEFAULT_FIXTURE_ACCOUNT,
          '1',
          '0.000042',
          '1.000042',
        );
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
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver, false);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(PRIVATE_KEY_TWO);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // send 1 ETH from snap account to account 1 and approve the transaction
        await sendTransactionWithSnapAccount(
          driver,
          DEFAULT_FIXTURE_ACCOUNT,
          '1',
          '0.000042',
          '1.000042',
          false,
        );
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
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver, false);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // Import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(PRIVATE_KEY_TWO);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // send 1 ETH from snap account to account 1 and reject the transaction
        await sendTransactionWithSnapAccount(
          driver,
          DEFAULT_FIXTURE_ACCOUNT,
          '1',
          '0.000042',
          '1.000042',
          false,
          false,
        );

        // check the transaction is failed in MetaMask activity list
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_failedTxNumberDisplayedInActivity();
      },
    );
  });
});
