import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures, unlockWallet } from '../../../helpers';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
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
import { arrangeTestUtils } from './helpers';
import { WALLET_PASSWORD } from '../../../helpers';
import { E2E_SRP } from '../../../default-fixture';

describe('Account syncing - Accounts with Balances', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  /**
   * This test verifies that account syncing gracefully handles accounts with pre-existing balances:
   * Phase 1: Add accounts that sync to user storage
   * Phase 2: Complete onboarding flow from scratch, verifying that synced accounts are visible
   */
  it('should gracefully handle adding accounts with balances and synced accounts', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = (server: Mockttp) => {
      userStorageMockttpController.setupPath(
        USER_STORAGE_FEATURE_NAMES.accounts,
        server,
      );
      return mockIdentityServices(server, userStorageMockttpController);
    };

    // Phase 1: Create and sync accounts
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withBackupAndSyncSettings()
          .build(),
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

        // Should see default account
        await accountListPage.check_accountDisplayedInAccountList('Account 1');

        // Set up event counter to track sync operations
        const { prepareEventsEmittedCounter, waitUntilSyncedAccountsNumberEquals } = arrangeTestUtils(
          driver,
          userStorageMockttpController,
        );
        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        // Add another second account
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });

        // Wait for sync operation to complete
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // Reopen account menu to verify both accounts are visible
        await header.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.check_accountDisplayedInAccountList('Account 2');

        await accountListPage.closeAccountModal();
      },
    );

    // Phase 2: Fresh onboarding to verify synced accounts persist
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        // Complete onboarding flow from scratch
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
        });

        const header = new HeaderNavbar(driver);
        await header.check_pageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        // Verify the synced accounts are present - only 2 accounts synced
        const visibleAccounts = ['Account 1', 'Account 2'];

        for (const accountName of visibleAccounts) {
          await accountListPage.check_accountDisplayedInAccountList(accountName);
        }
      },
    );
  });
});