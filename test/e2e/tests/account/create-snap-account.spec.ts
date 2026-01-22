import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import SnapAccountConfirmationDialog from '../../page-objects/pages/dialog/snap-account-confirmation-dialog';
import {
  installSnapSimpleKeyring,
  createSnapAccount,
  cancelSnapAccountCreation,
  cancelSnapAccountNaming,
} from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockSnapSimpleKeyringAndSite } from './snap-keyring-site-mocks';

describe('Create Snap Account', function (this: Suite) {
  it('create Snap account with custom name input ends in approval success', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapSimpleKeyringAndSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);

        const newCustomAccountLabel = 'Custom name';
        await createSnapAccount(driver, { accountName: newCustomAccountLabel });

        // Check snap account is displayed after adding the custom snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        // BUG #37591 - With BIP44 the account mame is not retained.
        // await new HeaderNavbar(driver).checkAccountLabel(newCustomAccountLabel);
        await new HeaderNavbar(driver).checkAccountLabel('Snap Account 1');
      },
    );
  });

  it('creates multiple Snap accounts with increasing numeric suffixes', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapSimpleKeyringAndSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);

        const newNames = ['SSK Account', 'SSK Account 2', 'SSK Account 3'];
        const expectedNames = [
          'Snap Account 1',
          'Snap Account 2',
          'Snap Account 3',
        ];

        // Create multiple snap accounts using the flow
        for (let i = 0; i < newNames.length; i++) {
          await createSnapAccount(driver, {
            accountName: newNames[i],
            isFirstAccount: i === 0,
          });
        }

        // Check 3 created snap accounts are displayed in the account list.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        for (const expectedName of expectedNames) {
          await accountListPage.checkAccountDisplayedInAccountList(
            expectedName,
          );
        }
      },
    );
  });

  it('create Snap account canceling on confirmation screen results in error on Snap', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapSimpleKeyringAndSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);

        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // Click create account on the dapp
        await snapSimpleKeyringPage.clickCreateAccount();

        // Switch to dialog and cancel
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await cancelSnapAccountCreation(driver);

        // Switch back to dapp and check error
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );
        await snapSimpleKeyringPage.checkErrorRequestMessageDisplayed();

        // Check snap account is not displayed in account list after canceling the creation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'SSK Account',
        );
      },
    );
  });

  it('create Snap account canceling on fill name screen results in error on Snap', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapSimpleKeyringAndSite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await installSnapSimpleKeyring(driver);

        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        const snapAccountDialog = new SnapAccountConfirmationDialog(driver);

        // Click create account on the dapp
        await snapSimpleKeyringPage.clickCreateAccount();

        // Switch to dialog, confirm, then cancel on name screen
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapAccountDialog.checkConfirmationDialogIsLoaded();
        await snapAccountDialog.clickConfirmButton();
        await cancelSnapAccountNaming(driver);

        // Switch back to dapp and check error
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );
        await snapSimpleKeyringPage.checkErrorRequestMessageDisplayed();

        // Check snap account is not displayed in account list after canceling the creation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'SSK Account',
        );
      },
    );
  });
});
