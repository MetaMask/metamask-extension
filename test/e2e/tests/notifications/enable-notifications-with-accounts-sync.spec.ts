import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/user-storage';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { mockIdentityServices } from '../identity/mocks';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { completeOnboardFlowIdentity } from '../identity/flows';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import {
  getAccountsSyncMockResponse,
  accountsToMockForAccountsSync as unencryptedMockAccounts,
} from '../identity/account-syncing/mock-data';
import NotificationsListPage from '../../page-objects/pages/notifications-list-page';
import NotificationsSettingsPage from '../../page-objects/pages/settings/notifications-settings-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { mockNotificationServices } from './mocks';

describe('Enable Notifications - With Accounts Syncing On', function () {
  this.timeout(120000); // Multiple Syncing features can cause this test to take some time

  describe('from inside MetaMask', function () {
    /**
     * Test notification settings persistence across sessions.
     *
     * Part 1: Initial Configuration
     * - Complete onboarding with pre-synced accounts
     * - Enable notifications and verify default state (all enabled)
     * - Modify settings:
     * → Disable second account notifications
     * → Disable product notifications
     *
     * Part 2: Persistence Check
     * - Start new session and complete onboarding
     * - Re-enable general notifications (required for each new session)
     * - Verify settings:
     * → General notifications: requires manual re-enable
     * → Product notifications: enabled (resets on new session)
     * → First account: enabled
     * → Second account: disabled (persisted from Part 1)
     */
    it('syncs notification settings on next onboarding after enabling for the first time', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();
      const mockedAccountsResponse = await getAccountsSyncMockResponse();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true })
            .withMetaMetricsController()
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            // Using previously synced accounts to avoid having to add accounts manually, therefore, making the tests run quicker
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
              {
                getResponse: mockedAccountsResponse,
              },
            );
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.notifications,
              server,
            );

            return [
              await mockNotificationServices(
                server,
                userStorageMockttpController,
              ),
              await mockIdentityServices(server, userStorageMockttpController),
            ];
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.enableNotifications();

          // Navigate to notifications settings through global menu > notifications > settings button
          const notificationsListPage = new NotificationsListPage(driver);
          await notificationsListPage.check_pageIsLoaded();
          await notificationsListPage.goToNotificationsSettings();

          const notificationsSettingsPage = new NotificationsSettingsPage(
            driver,
          );
          await notificationsSettingsPage.check_pageIsLoaded();

          await notificationsSettingsPage.check_notificationState({
            toggleType: 'general',
            expectedState: 'enabled',
          });

          await notificationsSettingsPage.check_notificationState({
            toggleType: 'product',
            expectedState: 'enabled',
          });

          for (const { a: address } of unencryptedMockAccounts) {
            await notificationsSettingsPage.check_notificationState({
              address,
              toggleType: 'address',
              expectedState: 'enabled',
            });
          }

          // Switch off address 2 and product notifications toggle
          await notificationsSettingsPage.clickNotificationToggle({
            address: unencryptedMockAccounts[1].a,
            toggleType: 'address',
          });

          await notificationsSettingsPage.clickNotificationToggle({
            toggleType: 'product',
          });
        },
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.notifications,
              server,
            );

            return [
              await mockNotificationServices(
                server,
                userStorageMockttpController,
              ),
              await mockIdentityServices(server, userStorageMockttpController),
            ];
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          // Navigate to notifications settings through global menu > settings > notifications settings
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToNotificationsSettings();

          const notificationsSettingsPage = new NotificationsSettingsPage(
            driver,
          );
          await notificationsSettingsPage.check_pageIsLoaded();
          await notificationsSettingsPage.clickNotificationToggle({
            toggleType: 'general',
          });

          await notificationsSettingsPage.check_notificationState({
            toggleType: 'general',
            expectedState: 'enabled',
          });

          await notificationsSettingsPage.check_notificationState({
            toggleType: 'product',
            expectedState: 'enabled',
          });

          const [{ a: account1 }, { a: account2 }] = unencryptedMockAccounts;

          await notificationsSettingsPage.check_notificationState({
            address: account1,
            toggleType: 'address',
            expectedState: 'enabled',
          });

          await notificationsSettingsPage.check_notificationState({
            address: account2,
            toggleType: 'address',
            expectedState: 'disabled',
          });
        },
      );
    });
  });
});
