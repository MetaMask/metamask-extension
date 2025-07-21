import path from 'path';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { DEFAULT_FIXTURE_ACCOUNT_SHORTENED } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';
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

describe('Import flow', function () {
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
  it('Import wallet using Secret Recovery Phrase with pasting word by word', async function () {
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
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
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.check_pageIsLoaded();
        await accountDetailsModal.check_addressInAccountDetailsModal(
          DEFAULT_FIXTURE_ACCOUNT_SHORTENED.toLowerCase(),
        );
      },
    );
  });

  it('Import Account using json file', async function () {
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
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
        await homePage.check_expectedBalanceIsDisplayed('0');
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
    const { mockedAccountSyncResponse, userStorageMockttpController } =
      await arrange();
    await withFixtures(
      {
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
