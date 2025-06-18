import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { ACCOUNT_TYPE } from '../../../constants';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { completeOnboardFlowIdentity } from '../flows';
import BackupAndSyncSettings from '../../../page-objects/pages/settings/backup-and-sync-settings';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from './mock-data';
import { arrangeTestUtils } from './helpers';

describe('Backup and Sync Settings', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

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

  describe('from inside MetaMask', function () {
    it('does not sync account changes when account sync is turned off', async function () {
      const {
        unencryptedAccounts,
        mockedAccountSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
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
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            mockedAccountSyncResponse.length,
            ACCOUNT_TYPE.Ethereum,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );

          await accountListPage.closeAccountModal();

          // Go to settings and turn off account sync
          await header.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToBackupAndSyncSettings();

          const backupAndSyncSettingsPage = new BackupAndSyncSettings(driver);
          await backupAndSyncSettingsPage.check_pageIsLoaded();
          await backupAndSyncSettingsPage.toggleAccountSync();

          // Go back to accounts and add a new account
          await header.openAccountMenu();
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
          });
          const { prepareEventsEmittedCounter } = arrangeTestUtils(
            driver,
            userStorageMockttpController,
          );
          const { waitUntilEventsEmittedNumberEquals } =
            prepareEventsEmittedCounter(
              UserStorageMockttpControllerEvents.PUT_SINGLE,
            );
          await waitUntilEventsEmittedNumberEquals(0);
        },
      );

      // Launch a new instance to verify the change wasn't synced
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();

          // Verify the account list is still the same as before
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            mockedAccountSyncResponse.length,
            ACCOUNT_TYPE.Ethereum,
          );
        },
      );
    });
  });
});
