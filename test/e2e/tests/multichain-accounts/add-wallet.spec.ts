import path from 'path';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from '../identity/account-syncing/mock-data';
import { mockIdentityServices } from '../identity/mocks';
import { withMultichainAccountsDesignEnabled } from './common';

describe('Add wallet', function () {
  const arrange = async () => {
    const unencryptedAccounts = accountsToMockForAccountsSync;
    const mockedAccountSyncResponse = await getAccountsSyncMockResponse();
    const userStorageMockttpController = new UserStorageMockttpController();
    return {
      unencryptedAccounts,
      mockedAccountSyncResponse,
      userStorageMockttpController,
    };
  };

  it('Import wallet using SRP during onboarding', async function () {
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
        forceBip44Version: 2,
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        testSpecificMock: (server: Mockttp) => {
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.accounts,
            server,
            {
              getResponse: mockedAccountSyncResponse,
            },
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          fillSrpWordByWord: true,
        });
        // Allow syncing to finish
        await driver.delay(3000);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        // BUG 37030 With BIP44 enabled wallet is not showing balance
        // await homePage.checkExpectedBalanceIsDisplayed(
        //  DEFAULT_LOCAL_NODE_USD_BALANCE,
        //  '$',
        // );

        // Open account details modal and check displayed account address
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountsPage();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });

        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
      },
    );
  });

  it('Add wallet using SRP', async function () {
    const E2E_SRP =
      'bench top weekend buyer spoon side resist become detect gauge eye feed';
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.startImportSecretPhrase(E2E_SRP, {
          isMultichainAccountsState2Enabled: true,
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountsPage();
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.checkNumberOfAvailableAccounts(3);
      },
    );
  });

  it('Import wallet using json file', async function () {
    const IMPORTED_ACCOUNT_NAME = 'Imported Account 1';
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
        forceBip44Version: 2,
        fixtures: new FixtureBuilder()
          .withAccountsControllerImportedAccount()
          .withKeyringControllerImportedAccountVault()
          .withPreferencesControllerImportedAccountIdentities()
          .build(),
        testSpecificMock: (server: Mockttp) => {
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.accounts,
            server,
            {
              getResponse: mockedAccountSyncResponse,
            },
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Wait until account list is loaded to mitigate race condition
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkAccountLabel('Account 1');
        await headerNavbar.openAccountsPage();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });

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
        await accountListPage.checkAccountDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('0');
        await accountListPage.checkNumberOfAvailableAccounts(4);
        await accountListPage.switchToAccount(IMPORTED_ACCOUNT_NAME);
        await headerNavbar.checkAccountLabel(IMPORTED_ACCOUNT_NAME);
      },
    );
  });

  it('Import wallet using private key of an already active account should result in an error', async function () {
    const testPrivateKey =
      '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9';
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
        forceBip44Version: 2,
        fixtures: new FixtureBuilder()
          .withKeyringControllerImportedAccountVault()
          .build(),
        testSpecificMock: (server: Mockttp) => {
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.accounts,
            server,
            {
              getResponse: mockedAccountSyncResponse,
            },
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkAccountLabel('Account 1');
        await headerNavbar.openAccountsPage();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });

        // import active account with private key from the account menu and check error message
        await accountListPage.addNewImportedAccount(
          testPrivateKey,
          'The account you are trying to import is a duplicate',
          { isMultichainAccountsState2Enabled: true },
        );
      },
    );
  });
});
