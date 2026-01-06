import { Mockttp } from 'mockttp';

import { E2E_SRP } from '../../../fixtures/default-fixture';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures, unlockWallet, WALLET_PASSWORD } from '../../../helpers';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import { mockMultichainAccountsFeatureFlagStateTwo } from '../../multichain-accounts/common';
import { mockInfuraAndAccountSync } from '../mocks';
import { arrangeTestUtils, skipOnFirefox } from './helpers';

describe('Account syncing - Accounts with Balances', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  // Accounts that will have balances and be discovered during onboarding
  const balancesAccounts = [
    '0x5cfe73b6021e818b776b421b1c4db2474086a7e1', // Account 1 (synced)
    '0x09781764c08de8ca82e156bbf156a3ca217c7950', // Account 2 (synced)
    '0x7de4768c33db8785f75075a054aeeed7e01c4497', // Account 3 (discovered via balance)
  ];

  /**
   * This test verifies that account syncing gracefully handles accounts with pre-existing balances:
   * Phase 1: Add accounts that sync to user storage (2 accounts)
   * Phase 2: Complete onboarding flow with balance mocking - should discover additional accounts with balances (3 total: 2 synced + 1 discovered)
   */
  it('gracefully handles adding accounts with balances and synced accounts', async function () {
    skipOnFirefox(this);

    const userStorageMockttpController = new UserStorageMockttpController();

    const phase1MockSetup = (server: Mockttp) => {
      mockMultichainAccountsFeatureFlagStateTwo(server);
      return mockInfuraAndAccountSync(server, userStorageMockttpController, {
        accountsToMockBalances: balancesAccounts,
      });
    };

    // Phase 1: Create and sync accounts
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: phase1MockSetup,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Should see default account
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');

        // Set up event counter to track sync operations
        const {
          prepareEventsEmittedCounter,
          waitUntilSyncedAccountsNumberEquals,
        } = arrangeTestUtils(driver, userStorageMockttpController);
        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        // Add another second account
        await accountListPage.addMultichainAccount();

        // Wait for sync operation to complete
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // Reopen account menu to verify both accounts are visible
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Account 2');

        await accountListPage.closeMultichainAccountsPage();
      },
    );

    // Phase 2: Fresh onboarding with balance mocking to discover additional accounts
    const phase2MockSetup = (server: Mockttp) => {
      mockMultichainAccountsFeatureFlagStateTwo(server);
      return mockInfuraAndAccountSync(server, userStorageMockttpController, {
        accountsToMockBalances: balancesAccounts,
      });
    };

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withRemoteFeatureFlags({
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: '13.5.0',
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: phase2MockSetup,
      },
      async ({ driver }) => {
        // Complete onboarding flow from scratch
        await completeImportSRPOnboardingFlow({
          driver,
          seedPhrase: E2E_SRP,
          password: WALLET_PASSWORD,
        });

        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();
        await header.openAccountMenu();

        const homePage = new HomePage(driver);

        const accountListPage = new AccountListPage(driver);
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        // Verify synced accounts + discovered account with balance are present
        // 2 synced accounts + 1 discovered via balance = 3 total
        const visibleAccounts = ['Account 1', 'Account 2', 'Account 3'];

        for (const accountName of visibleAccounts) {
          await accountListPage.checkAccountDisplayedInAccountList(accountName);
        }
      },
    );
  });
});
