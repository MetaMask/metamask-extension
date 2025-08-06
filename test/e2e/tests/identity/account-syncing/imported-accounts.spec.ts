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
import { arrangeTestUtils } from './helpers';

describe('Account syncing - Unsupported Account types', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const DEFAULT_ACCOUNT_NAME = 'Account 1';
  const SECOND_ACCOUNT_NAME = 'Account 2';
  const IMPORTED_ACCOUNT_NAME = 'Account 3';

  // Test private key from the mobile tests
  const IMPORTED_PRIVATE_KEY =
    '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9';

  /**
   * This test verifies that imported accounts are not synced to user storage:
   * Phase 1: Create regular accounts, import a private key account, and verify the imported account is visible in the current session
   * Phase 2: Login to a fresh app instance and verify only regular accounts persist (imported accounts are excluded)
   */
  it('should not sync imported accounts and exclude them when logging into a fresh app instance', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    const sharedMockSetup = (server: Mockttp) => {
      userStorageMockttpController.setupPath(
        USER_STORAGE_FEATURE_NAMES.accounts,
        server,
      );
      return mockIdentityServices(server, userStorageMockttpController);
    };

    // Phase 1: Create regular accounts and import a private key account
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

        // Add a second regular account (this should sync)
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });

        // Wait for sync operation to complete
        await waitUntilSyncedAccountsNumberEquals(2);
        await waitUntilEventsEmittedNumberEquals(1);

        // Reopen account menu to verify both regular accounts are visible
        await header.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          DEFAULT_ACCOUNT_NAME,
        );
        await accountListPage.checkAccountDisplayedInAccountList(
          SECOND_ACCOUNT_NAME,
        );

        // Import a private key account (this should NOT sync)
        await accountListPage.addNewImportedAccount(IMPORTED_PRIVATE_KEY);

        // Verify imported account is visible in current session
        await header.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
        );

        await accountListPage.closeAccountModal();
      },
    );

    // Phase 2: Login to fresh instance and verify only regular accounts persist
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

        // Verify regular accounts are still visible (synced accounts)
        const visibleAccounts = [DEFAULT_ACCOUNT_NAME, SECOND_ACCOUNT_NAME];

        for (const accountName of visibleAccounts) {
          await accountListPage.checkAccountDisplayedInAccountList(
            accountName,
          );
        }

        // Verify imported account is NOT visible (not synced)
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          IMPORTED_ACCOUNT_NAME,
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
