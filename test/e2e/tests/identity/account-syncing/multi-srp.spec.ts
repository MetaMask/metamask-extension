import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures, unlockWallet } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { ACCOUNT_TYPE } from '../../../constants';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { IDENTITY_TEAM_SEED_PHRASE_2 } from '../constants';
import { arrangeTestUtils } from './helpers';

describe('Account syncing - Multiple SRPs', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const DEFAULT_ACCOUNT_NAME = 'Account 1';
  const SECOND_ACCOUNT_NAME = 'Account 2';
  const SRP_2_FIRST_ACCOUNT = 'Account 3';
  const SRP_2_SECOND_ACCOUNT = 'My Fourth Account';

  /**
   * This test verifies account syncing when adding accounts across multiple SRPs:
   * Phase 1: Starting with the default account, add a second account to the first SRP, import a second SRP which automatically creates a third account, then manually create a fourth account on the second SRP with a custom name.
   * Phase 2: Login to a fresh app instance and verify all accounts from both SRPs persist and are visible after importing the second SRP.
   */
  it('should add accounts across multiple SRPs and sync them', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = (server: Mockttp) => {
      userStorageMockttpController.setupPath(
        USER_STORAGE_FEATURE_NAMES.accounts,
        server,
      );
      return mockIdentityServices(server, userStorageMockttpController);
    };

    // Phase 1: Add a second account to the first SRP
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const header = new HeaderNavbar(driver);
        await header.check_pageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Verify default account is visible
        await accountListPage.check_accountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );

        // Set up event counter to track sync operations
        const {
          prepareEventsEmittedCounter,
          waitUntilSyncedAccountsNumberEquals,
        } = arrangeTestUtils(driver, userStorageMockttpController);
        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        // Add a second account to the first SRP
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });

        // Wait for sync operation to complete
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // Reopen account menu to verify both accounts are visible
        await header.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.check_accountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );

        await accountListPage.closeAccountModal();

        // Import second SRP (this will automatically create the third account)
        await header.openAccountMenu();
        await accountListPage.startImportSecretPhrase(
          IDENTITY_TEAM_SEED_PHRASE_2,
        );

        // Wait for the import to complete and sync
        await waitUntilSyncedAccountsNumberEquals(3);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        // Add a fourth account with custom name to the second SRP
        await header.openAccountMenu();
        await accountListPage.check_pageIsLoaded();

        // Add account with custom name to specific SRP
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName: SRP_2_SECOND_ACCOUNT,
          srpIndex: 2, // Second SRP
        });

        // Verify all accounts are visible
        await header.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList(
          SRP_2_SECOND_ACCOUNT,
        );

        await accountListPage.closeAccountModal();
      },
    );

    // Phase 2: Login to fresh instance, import second SRP and verify all accounts persist
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const header = new HeaderNavbar(driver);
        await header.check_pageIsLoaded();

        // Import the second SRP to get access to all accounts
        await header.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.startImportSecretPhrase(
          IDENTITY_TEAM_SEED_PHRASE_2,
        );

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        // Verify all accounts from both SRPs are visible
        await header.openAccountMenu();
        await accountListPage.check_pageIsLoaded();

        const visibleAccounts = [
          DEFAULT_ACCOUNT_NAME,
          SECOND_ACCOUNT_NAME,
          SRP_2_FIRST_ACCOUNT,
          SRP_2_SECOND_ACCOUNT,
        ];

        for (const accountName of visibleAccounts) {
          await accountListPage.check_accountDisplayedInAccountList(
            accountName,
          );
        }

        // Verify we have exactly 4 accounts
        await accountListPage.check_numberOfAvailableAccounts(
          4,
          ACCOUNT_TYPE.Ethereum,
        );
      },
    );
  });
});
