import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import ConfirmationPage from '../page-objects/pages/confirmation-page';
import SnapAccountNamingPage from '../page-objects/pages/snap-account-naming-page';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import AccountListPage from '../page-objects/pages/account-list-page';
import SnapAccountCreationPage from '../page-objects/pages/snap-account-creation-page';

describe('Create Snap Account', function () {
  const snapName = 'Snap Simple Keyring';
  const snapId = 'npm:@metamask/snap-simple-keyring';

  it('create Snap account popup contains correct Snap name and snapId', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const confirmationPage = new ConfirmationPage(driver);
        const snapAccountCreationPage = new SnapAccountCreationPage(driver);

        await loginWithBalanceValidation(driver);
        await snapAccountCreationPage.createAccount();

        await confirmationPage.waitForConfirmationPage();
        await snapAccountCreationPage.checkSnapName(snapName);
        await snapAccountCreationPage.checkSnapId(snapId);
        await snapAccountCreationPage.checkCreateButtonExists();
        await snapAccountCreationPage.checkCancelButtonExists();
      },
    );
  });

  it('create Snap account with custom name', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const confirmationPage = new ConfirmationPage(driver);
        const snapAccountNamingPage = new SnapAccountNamingPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);
        const snapAccountCreationPage = new SnapAccountCreationPage(driver);

        await loginWithBalanceValidation(driver);
        await snapAccountCreationPage.createAccount();

        await confirmationPage.clickConfirmButton();

        const newAccountLabel = 'Custom Account Name';
        await snapAccountNamingPage.enterAccountName(newAccountLabel);
        await snapAccountNamingPage.confirmAccountCreation();

        await confirmationPage.clickConfirmButton();

        await headerNavbar.check_accountLabel(newAccountLabel);
        await accountListPage.check_accountDisplayedInAccountList(newAccountLabel);
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
        const confirmationPage = new ConfirmationPage(driver);
        const snapAccountNamingPage = new SnapAccountNamingPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);
        const snapAccountCreationPage = new SnapAccountCreationPage(driver);

        await loginWithBalanceValidation(driver);
        const expectedNames = ['SSK Account', 'SSK Account 2', 'SSK Account 3'];

        for (const expectedName of expectedNames) {
          await snapAccountCreationPage.createAccount();

          await confirmationPage.clickConfirmButton();
          await snapAccountNamingPage.confirmAccountCreation();
          await confirmationPage.clickConfirmButton();

          await headerNavbar.check_accountLabel(expectedName);
          await accountListPage.check_accountDisplayedInAccountList(expectedName);
        }
      },
    );
  });

  it('create Snap account confirmation cancellation results in error in Snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const confirmationPage = new ConfirmationPage(driver);
        const accountListPage = new AccountListPage(driver);
        const snapAccountCreationPage = new SnapAccountCreationPage(driver);

        await loginWithBalanceValidation(driver);
        await snapAccountCreationPage.createAccount();

        await confirmationPage.clickRejectButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
        await snapAccountCreationPage.checkDappConnectionStatus();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
        await accountListPage.check_accountIsNotDisplayedInAccountList('SSK Account');
      },
    );
  });
});
