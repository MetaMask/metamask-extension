import { Mockttp } from 'mockttp';

import {
  USER_STORAGE_GROUPS_FEATURE_KEY,
  USER_STORAGE_WALLETS_FEATURE_KEY,
} from '@metamask/account-tree-controller';
import { E2E_SRP } from '../../../fixtures/default-fixture';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures, unlockWallet, WALLET_PASSWORD } from '../../../helpers';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import { mockMultichainAccountsFeatureFlagStateTwo } from '../../multichain-accounts/common';
import { mockIdentityServices } from '../mocks';
import { arrangeTestUtils, skipOnFirefox } from './helpers';

describe('Account syncing - Adding and Renaming Accounts', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const DEFAULT_ACCOUNT_NAME = 'Account 1';
  const ADDED_ACCOUNT_NAME = 'Account 2';
  const NEW_ACCOUNT_NAME = 'RENAMED ACCOUNT';
  const LAST_ACCOUNT_NAME = 'Account 3';

  /**
   * This test verifies the complete account syncing flow for adding and renaming accounts across three phases:
   * Phase 1: From a loaded state with account syncing enabled, add a new account to the wallet and verify it syncs to user storage, checking that both the default account and newly added account are visible.
   * Phase 2: Login to a fresh app instance, verify the previously added account persists, rename the second account, and add a third account to test multi-operation syncing.
   * Phase 3: Complete onboarding flow from scratch to verify all account changes (additions and renames) are properly synced and persisted across app reinstallation.
   */

  it('adds a new account and sync it across multiple phases', async function () {
    skipOnFirefox(this);

    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = (server: Mockttp) => {
      userStorageMockttpController.setupPath(
        USER_STORAGE_GROUPS_FEATURE_KEY,
        server,
      );
      userStorageMockttpController.setupPath(
        USER_STORAGE_WALLETS_FEATURE_KEY,
        server,
      );
      mockMultichainAccountsFeatureFlagStateTwo(server);
      return mockIdentityServices(server, userStorageMockttpController);
    };

    // Phase 1: Add a new account and verify it syncs
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Wait for the initial account sync to complete before adding new accounts
        const homePage = new HomePage(driver);
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Verify default account is visible
        await accountListPage.checkAccountDisplayedInAccountList(
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

        // Add a new account
        await accountListPage.addMultichainAccount();

        // Wait for sync operation to complete
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // Reopen account menu to verify both accounts are visible
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          ADDED_ACCOUNT_NAME,
        );

        await accountListPage.closeMultichainAccountsPage();
      },
    );

    // Phase 2: Login to fresh instance, verify account persists, rename and add more accounts
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Wait for the initial account sync to complete before interacting with accounts
        const homePage = new HomePage(driver);
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Verify both accounts from previous phase are still visible
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          ADDED_ACCOUNT_NAME,
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

        // Rename the second account
        await accountListPage.openMultichainAccountMenu({
          accountLabel: ADDED_ACCOUNT_NAME,
        });
        await accountListPage.clickMultichainAccountMenuItem('Rename');
        await accountListPage.changeMultichainAccountLabel(NEW_ACCOUNT_NAME);

        // Add a third account
        await accountListPage.addMultichainAccount();

        // Wait for both sync operations to complete (rename + add)
        await waitUntilSyncedAccountsNumberEquals(3);
        await waitUntilEventsEmittedNumberEquals(2);

        // Reopen account menu to verify all accounts are visible with correct names
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          NEW_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          LAST_ACCOUNT_NAME,
        );

        await accountListPage.closeMultichainAccountsPage();
      },
    );

    // Phase 3: Complete onboarding flow from scratch to verify all changes persist
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        // Go through onboarding again to ensure accounts and names are synced
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
        });

        // Wait for sync to complete during onboarding
        const homePage = new HomePage(driver);
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();
        // await driver.delay(2000);

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Verify all accounts and renames are properly synced
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          NEW_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          LAST_ACCOUNT_NAME,
        );

        // Note: We don't check the exact count since onboarding with E2E_SRP
        // may discover additional accounts with balances/activity on-chain
        // The important thing is that our synced accounts are present
      },
    );
  });
});
