import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { accountsToMockForAccountsSync as unencryptedMockAccounts } from '../identity/account-syncing/mock-data';
import { Driver } from '../../webdriver/driver';
import {
  enableNotificationsThroughGlobalMenu,
  enableNotificationsThroughSettingsPage,
} from '../../page-objects/flows/notifications.flow';
import NotificationsSettingsPage from '../../page-objects/pages/settings/notifications-settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { completeOnboardFlowIdentity } from '../identity/flows';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import { MockttpNotificationTriggerServer } from '../../helpers/notifications/mock-notification-trigger-server';
import { mockNotificationServices } from './mocks';

describe('Enable Notifications - Without Accounts Syncing', function () {
  describe('from inside MetaMask', function () {
    /**
     * Test notification settings persistence across sessions.
     * This specifically tests the scenario where accounts syncing is not on (i.e on Firefox or when user has not enabled this feature)
     *
     * Part 1: Initial Configuration
     * - Complete onboarding
     * - Adds some accounts
     * - Enable notifications and verify default state (all enabled)
     * - Modify settings:
     * → Disable second account notifications
     * → Disable product notifications
     *
     * Part 2: Persistence Check
     * - Start new session and complete onboarding
     * - Re-enable general notifications (required for each new session)
     * - Add accounts again
     * - Verify settings:
     * → General notifications: requires manual re-enable
     * → Product notifications: enabled (resets on new session)
     * → First account: enabled
     * → Second account: disabled (persisted from Part 1)
     */
    it('syncs notification settings on next onboarding after enabling for the first time', async function () {
      // server that persists trigger settings.
      const triggerServer = new MockttpNotificationTriggerServer();
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true })
            .withMetaMetricsController()
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            await mockNotificationServices(server, triggerServer);
          },
        },
        async ({ driver }) => {
          await onboardAndAddAccount(driver);
          await enableNotificationsThroughGlobalMenu(driver);
          const notificationsSettingsPage = new NotificationsSettingsPage(
            driver,
          );
          await notificationsSettingsPage.assertMainNotificationSettingsTogglesEnabled(
            driver,
          );

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
            return [await mockNotificationServices(server, triggerServer)];
          },
        },
        async ({ driver }) => {
          await onboardAndAddAccount(driver);
          await enableNotificationsThroughSettingsPage(driver);
          const notificationsSettingsPage = new NotificationsSettingsPage(
            driver,
          );
          await notificationsSettingsPage.assertMainNotificationSettingsTogglesEnabled(
            driver,
          );

          // Assert Notification Account Settings have persisted
          // The second account was switched off from the initial run
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
    async function onboardAndAddAccount(driver: Driver) {
      await completeOnboardFlowIdentity(driver);

      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.openAccountMenu();

      const accountListPage = new AccountListPage(driver);
      await accountListPage.addAccount({ accountType: ACCOUNT_TYPE.Ethereum });
    }
  });
});
