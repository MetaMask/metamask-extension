import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Create Snap Account', function (this: Suite) {
  it('create Snap account with custom name input ends in approval success', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        const newCustomAccountLabel = 'Custom name';
        await snapSimpleKeyringPage.createNewAccount(newCustomAccountLabel);

        // Check snap account is displayed after adding the custom snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).check_accountLabel(
          newCustomAccountLabel,
        );
      },
    );
  });

  it('creates multiple Snap accounts with increasing numeric suffixes', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        const expectedNames = ['SSK Account', 'SSK Account 2', 'SSK Account 3'];

        // Create multiple snap accounts on snap simple keyring page
        for (const expectedName of expectedNames) {
          if (expectedName === 'SSK Account') {
            await snapSimpleKeyringPage.createNewAccount(expectedName, true);
          } else {
            await snapSimpleKeyringPage.createNewAccount(expectedName, false);
          }
        }

        // Check 3 created snap accounts are displayed in the account list.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        for (const expectedName of expectedNames) {
          await accountListPage.check_accountDisplayedInAccountList(
            expectedName,
          );
        }
      },
    );
  });

  it('create Snap account canceling on confirmation screen results in error on Snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // cancel snap account creation on confirmation screen
        await snapSimpleKeyringPage.openCreateSnapAccountConfirmationScreen();
        await snapSimpleKeyringPage.cancelCreateSnapOnConfirmationScreen();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );
        await snapSimpleKeyringPage.check_errorRequestMessageDisplayed();

        // Check snap account is not displayed in account list after canceling the creation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountIsNotDisplayedInAccountList(
          'SSK Account',
        );
      },
    );
  });

  it('create Snap account canceling on fill name screen results in error on Snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // cancel snap account creation on fill name screen
        await snapSimpleKeyringPage.openCreateSnapAccountConfirmationScreen();
        await snapSimpleKeyringPage.confirmCreateSnapOnConfirmationScreen();
        await snapSimpleKeyringPage.cancelCreateSnapOnFillNameScreen();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );
        await snapSimpleKeyringPage.check_errorRequestMessageDisplayed();

        // Check snap account is not displayed in account list after canceling the creation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountIsNotDisplayedInAccountList(
          'SSK Account',
        );
      },
    );
  });
});
