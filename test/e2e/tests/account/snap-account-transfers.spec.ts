import { Suite } from 'mocha';
import {
  veryLargeDelayMs,
  PRIVATE_KEY_TWO,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionWithSnapAccount } from '../../page-objects/flows/send-transaction.flow';
import { mockSimpleKeyringSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

describe('Snap Account Transfers', function (this: Suite) {
  it('can import a private key and transfer 1 ETH (sync flow)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSimpleKeyringSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

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
        await headerNavbar.checkAccountLabel('SSK Account');

        // send 1 ETH from snap account to account 1
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
        });
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();

        // check the balance of the 2 accounts are updated
        await driver.delay(veryLargeDelayMs);
        await accountList.checkAccountBalanceDisplayed('$44,200');
        await accountList.checkAccountBalanceDisplayed('$40,799');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSimpleKeyringSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

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
        await headerNavbar.checkAccountLabel('SSK Account');

        // send 1 ETH from snap account to account 1 and approve the transaction
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
          isSyncFlow: false,
        });
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();

        // check the balance of the 2 accounts are updated
        await driver.delay(veryLargeDelayMs);
        await accountList.checkAccountBalanceDisplayed('$44,200');
        await accountList.checkAccountBalanceDisplayed('$40,799');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow reject)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSimpleKeyringSnap,
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: ['Request rejected by user or snap.'],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

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
        await headerNavbar.checkAccountLabel('SSK Account');

        // send 1 ETH from snap account to account 1 and reject the transaction
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
          isSyncFlow: false,
          approveTransaction: false,
        });

        // check the transaction is failed in MetaMask activity list
        await new HomePage(driver).checkPageIsLoaded();
        await new ActivityListPage(
          driver,
        ).checkFailedTxNumberDisplayedInActivity();
      },
    );
  });
});
