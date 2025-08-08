import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures, unlockWallet } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { ACCOUNT_TYPE } from '../../../constants';
import { PAGES } from '../../../webdriver/driver';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import BackupAndSyncSettings from '../../../page-objects/pages/settings/backup-and-sync-settings';
import { arrangeTestUtils } from './helpers';

describe('Account syncing - Settings Toggle', function () {
  const DEFAULT_ACCOUNT_NAME = 'Account 1';
  const SECOND_ACCOUNT_NAME = 'Account 2';
  const THIRD_ACCOUNT_NAME = 'Account 3';

  /**
   * This test verifies the account syncing flow for adding accounts with sync toggle functionality:
   * Phase 1: From a loaded state with account syncing enabled, Add a new account with sync enabled and verify it syncs to user storage
   * Phase 2: Disable account sync, add another account, and verify it doesn't sync
   * Phase 3: Login to a fresh app instance and verify only synced accounts persist
   */
  it('should sync new accounts when account sync is enabled and exclude accounts created when sync is disabled', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = (server: Mockttp) => {
      userStorageMockttpController.setupPath(
        USER_STORAGE_FEATURE_NAMES.accounts,
        server,
      );
      return mockIdentityServices(server, userStorageMockttpController);
    };

    // Phase 1: Initial setup and account creation with sync enabled
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Verify the default account exists
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );

        // Set up event listener to track sync operations
        const {
          prepareEventsEmittedCounter,
          waitUntilSyncedAccountsNumberEquals,
        } = arrangeTestUtils(driver, userStorageMockttpController);
        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        // Create second account with sync enabled - this should sync to user storage
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });

        // Wait for sync operation to complete
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // Reopen account menu to verify second account was created successfully
        await header.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );

        await accountListPage.closeAccountModal();

        // Phase 2: Disable account sync and create third account
        // Navigate to Settings to toggle account sync
        await header.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToBackupAndSyncSettings();

        // Disable account synchronization
        const backupAndSyncSettingsPage = new BackupAndSyncSettings(driver);
        await backupAndSyncSettingsPage.checkPageIsLoaded();
        await backupAndSyncSettingsPage.toggleAccountSync();

        // Navigate back to wallet to create third account
        await driver.navigate(PAGES.HOME);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();
        await accountListPage.checkPageIsLoaded();

        // Create third account with sync disabled - this should NOT sync to user storage
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });

        // Reopen account menu to verify third account was created locally
        await header.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          THIRD_ACCOUNT_NAME,
        );

        await accountListPage.closeAccountModal();
      },
    );

    // Phase 3: Fresh app instance to verify sync persistence
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        // Login to fresh app instance to test sync restoration
        await unlockWallet(driver);

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Verify only accounts created with sync enabled are restored
        const visibleAccounts = [DEFAULT_ACCOUNT_NAME, SECOND_ACCOUNT_NAME];

        for (const accountName of visibleAccounts) {
          await accountListPage.checkAccountDisplayedInAccountList(accountName);
        }

        // Verify third account (created with sync disabled) is NOT restored
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          THIRD_ACCOUNT_NAME,
        );

        // Verify we only have 2 accounts (not 3)
        await accountListPage.checkNumberOfAvailableAccounts(
          2,
          ACCOUNT_TYPE.Ethereum,
        );
      },
    );
  });
});
