import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/user-storage';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { completeOnboardFlowIdentity } from '../../page-objects/flows/identity.flow';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import { IDENTITY_TEAM_STORAGE_KEY } from '../identity/constants';
import { createEncryptedResponse } from '../../helpers/identity/user-storage/generateEncryptedData';
import {
  enableNotificationsThroughGlobalMenu,
  enableNotificationsThroughSettingsPage,
} from '../../page-objects/flows/notifications.flow';
import NotificationsSettingsPage from '../../page-objects/pages/settings/notifications-settings-page';
import { Driver } from '../../webdriver/driver';
import { MockttpNotificationTriggerServer } from '../../helpers/notifications/mock-notification-trigger-server';
import { mockIdentityServices } from '../identity/mocks';
import { mockNotificationServices, notificationsMockAccounts } from './mocks';

/**
 * Generates encrypted mock response for notifications tests
 */
async function getNotificationsMockResponse() {
  return Promise.all(
    notificationsMockAccounts.map((account) =>
      createEncryptedResponse({
        data: account,
        storageKey: IDENTITY_TEAM_STORAGE_KEY,
        path: `${USER_STORAGE_FEATURE_NAMES.accounts}.${account.a}`,
      }),
    ),
  );
}

describe('Enable Notifications - With Accounts Syncing On', function () {
  // This test runs two full identity onboarding flows back-to-back, each
  // incurring SRP import, sign-in and account-sync settling, so it needs more
  // than the default budget.
  this.timeout(180000);

  describe('from inside MetaMask', function () {
    /**
     * Test notification settings persistence across sessions.
     *
     * Part 1: Initial Configuration
     * - Complete onboarding with pre-synced accounts
     * - Enable notifications and verify initial default state
     * - Modify settings:
     * → Disable second account notifications
     * → Disable product notifications
     *
     * Part 2: Persistence Check
     * - Start new session and complete onboarding
     * - Re-enable general notifications (required for each new session)
     * - Verify settings:
     * → General notifications: requires manual re-enable
     * → Product notifications: disabled (persisted in AUS)
     * → First account: enabled
     * → Second account: disabled (persisted in AUS from Part 1)
     */
    // TODO: Re-write this test when multichain account syncing has been merged
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('syncs notification settings on next onboarding after enabling for the first time', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();
      const triggerServer = new MockttpNotificationTriggerServer();
      const mockedAccountsResponse = await getNotificationsMockResponse();

      // First device setup
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            // Add mock accounts to subscriptionAccountsSeen for second device too
            .withNotificationServicesController({
              subscriptionAccountsSeen: notificationsMockAccounts.map(
                (account) => account.a,
              ),
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
              {
                getResponse: mockedAccountsResponse,
              },
            );
            return [
              await mockNotificationServices(server, triggerServer),
              await mockIdentityServices(server, userStorageMockttpController),
            ];
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);
          await enableNotificationsThroughGlobalMenu(driver);
          const notificationsSettingsPage = new NotificationsSettingsPage(
            driver,
          );
          await notificationsSettingsPage.assertMainNotificationSettingsTogglesState(
            driver,
            { marketingInAppExpectedState: 'disabled' },
          );
          await assertAllAccountsEnabled(driver);

          // Update preferences for persistence check:
          // disable account 2 and toggle marketing in-app notifications.
          await notificationsSettingsPage.clickNotificationToggle({
            address: notificationsMockAccounts[1].a,
            toggleType: 'address',
          });

          await notificationsSettingsPage.clickNotificationToggle({
            toggleType: 'product',
          });
        },
      );

      // Second device setup
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true })
            // Add mock accounts to subscriptionAccountsSeen for second device too
            .withNotificationServicesController({
              subscriptionAccountsSeen: notificationsMockAccounts.map(
                (account) => account.a,
              ),
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );
            return [
              await mockNotificationServices(server, triggerServer),
              await mockIdentityServices(server, userStorageMockttpController),
            ];
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);
          await enableNotificationsThroughSettingsPage(driver);
          const notificationsSettingsPage = new NotificationsSettingsPage(
            driver,
          );
          await notificationsSettingsPage.assertMainNotificationSettingsTogglesState(
            driver,
          );

          // Assert Notification Account Settings have persisted
          // The second account was switched off from the initial run
          const [{ a: account1 }, { a: account2 }] = notificationsMockAccounts;
          await notificationsSettingsPage.checkNotificationState({
            address: account1,
            toggleType: 'address',
            expectedState: 'enabled',
          });

          await notificationsSettingsPage.checkNotificationState({
            address: account2,
            toggleType: 'address',
            expectedState: 'disabled',
          });
        },
      );
    });
    async function assertAllAccountsEnabled(driver: Driver) {
      const notificationsSettingsPage = new NotificationsSettingsPage(driver);
      for (const { a: address } of notificationsMockAccounts) {
        await notificationsSettingsPage.checkNotificationState({
          address,
          toggleType: 'address',
          expectedState: 'enabled',
        });
      }
      return notificationsSettingsPage;
    }
  });
});
