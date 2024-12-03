import path from 'path';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';

describe('Import flow @no-mmi', function () {
  it('Import wallet using Secret Recovery Phrase with pasting word by word', async function () {
    const testAddress = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          fillSrpWordByWord: true,
        });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();

        // Open account details modal and check displayed account address
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('Account 1');
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.openAccountDetailsModal('Account 1');
        await accountListPage.check_addressInAccountDetailsModal(
          testAddress.toLowerCase(),
        );
      },
    );
  });

  it('Import Account using json file', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withKeyringControllerImportedAccountVault()
          .withPreferencesControllerImportedAccountIdentities()
          .withAccountsControllerImportedAccount()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Wait until account list is loaded to mitigate race condition
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('Account 1');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Imports an account with JSON file
        const jsonFile = path.join(
          __dirname,
          '../..',
          'import-utc-json',
          'test-json-import-account-file.json',
        );
        await accountListPage.importAccountWithJsonFile(
          jsonFile,
          'foobarbazqux',
        );

        // Check new imported account has correct name and label
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();
        await headerNavbar.check_accountLabel('Account 4');

        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_numberOfAvailableAccounts(4);
        await accountListPage.check_currentAccountIsImported();
      },
    );
  });

  it('Import Account using private key of an already active account should result in an error', async function () {
    const testPrivateKey =
      '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9';
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withKeyringControllerImportedAccountVault()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('Account 1');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // import active account with private key from the account menu and check error message
        await accountListPage.addNewImportedAccount(
          testPrivateKey,
          'The account you are trying to import is a duplicate',
        );
      },
    );
  });
});
