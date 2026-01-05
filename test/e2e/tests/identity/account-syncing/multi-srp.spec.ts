import { Mockttp } from 'mockttp';
import {
  USER_STORAGE_GROUPS_FEATURE_KEY,
  USER_STORAGE_WALLETS_FEATURE_KEY,
} from '@metamask/account-tree-controller';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { mockIdentityServices } from '../mocks';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { IDENTITY_TEAM_SEED_PHRASE_2 } from '../constants';
import { mockMultichainAccountsFeatureFlagStateTwo } from '../../multichain-accounts/common';
import { arrangeTestUtils, skipOnFirefox } from './helpers';

describe('Account syncing - Multiple SRPs', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const DEFAULT_ACCOUNT_NAME = 'Account 1';
  const SECOND_ACCOUNT_NAME = 'Account 2';
  const SRP_2_FIRST_ACCOUNT = 'Account 1';
  const SRP_2_SECOND_ACCOUNT = 'My Fourth Account';

  /**
   * This test verifies account syncing when adding accounts across multiple SRPs:
   * Phase 1: Starting with the default account, add a second account to the first SRP, import a second SRP which automatically creates a third account, then manually create a fourth account on the second SRP with a custom name.
   * Phase 2: Login to a fresh app instance and verify all accounts from both SRPs persist and are visible after importing the second SRP.
   */
  it('adds accounts across multiple SRPs and sync them', async function () {
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

    // Phase 1: Add a second account to the first SRP
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: sharedMockSetup,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

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

        // Wait for initial account sync to complete before adding a new account
        await waitUntilSyncedAccountsNumberEquals(1);

        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        // Add a second account to the first SRP
        await accountListPage.addMultichainAccount();

        // Wait for sync operation to complete
        // Check event first to ensure sync was attempted, then verify state
        await waitUntilEventsEmittedNumberEquals(1);
        await waitUntilSyncedAccountsNumberEquals(2);

        // Verify both accounts are visible
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );

        // Import second SRP (this will automatically create the third account)
        await accountListPage.startImportSecretPhrase(
          IDENTITY_TEAM_SEED_PHRASE_2,
        );

        // Importing an SRP can be long, so we add a bit of extra time here
        await driver.delay(10000);

        // Add a fourth account with custom name to the second SRP
        await header.openAccountMenu();
        await accountListPage.checkPageIsLoaded();

        // Add account with custom name to specific SRP
        await accountListPage.addMultichainAccount({
          srpIndex: 1, // Second SRP
        });

        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 2',
          srpIndex: 1,
        });
        await accountListPage.clickMultichainAccountMenuItem('Rename');
        await accountListPage.changeMultichainAccountLabel(
          SRP_2_SECOND_ACCOUNT,
        );

        await waitUntilEventsEmittedNumberEquals(5);

        // Verify all accounts are visible
        await accountListPage.checkAccountDisplayedInAccountList(
          SRP_2_SECOND_ACCOUNT,
        );

        await accountListPage.closeMultichainAccountsPage();
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
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');
        const header = new HeaderNavbar(driver);
        await header.checkPageIsLoaded();

        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();
        // await driver.delay(2000); // Wait for potential sync to complete

        // Import the second SRP to get access to all accounts
        await header.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.startImportSecretPhrase(
          IDENTITY_TEAM_SEED_PHRASE_2,
        );

        // Importing an SRP can be long, so we add a bit of extra time here
        await driver.delay(10000);

        // Verify all accounts from both SRPs are visible
        await header.openAccountMenu();
        const visibleAccounts = [
          DEFAULT_ACCOUNT_NAME,
          SECOND_ACCOUNT_NAME,
          SRP_2_FIRST_ACCOUNT,
          SRP_2_SECOND_ACCOUNT,
        ];

        for (const accountName of visibleAccounts) {
          await accountListPage.checkAccountDisplayedInAccountList(accountName);
        }

        // Verify we have exactly 4 accounts
        await accountListPage.checkNumberOfAvailableAccounts(4);
      },
    );
  });
});
