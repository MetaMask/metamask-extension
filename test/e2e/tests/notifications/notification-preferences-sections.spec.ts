import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import {
  login,
  lockAndWaitForLoginPage,
} from '../../page-objects/flows/login.flow';
import { withFixtures } from '../../helpers';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { goToNotificationsSettingsPage } from '../../page-objects/flows/notifications.flow';
import NotificationsSettingsPage from '../../page-objects/pages/settings/notifications-settings-page';
import { MockttpNotificationTriggerServer } from '../../helpers/notifications/mock-notification-trigger-server';
import { mockNotificationServices } from './mocks';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

async function mockFeatureFlagsWithoutAutoEnableNotifications(server: Mockttp) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  return await server
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        ...prodFlags,
        { assetsEnableNotificationsByDefault: false },
        { assetsEnableNotificationsByDefaultV2: { value: false } },
      ],
    }));
}

/**
 * All section preferences are persisted as a single object via one request to
 * the authenticated user storage notification-preferences endpoint, so a single
 * section exercises the full persistence round-trip (PUT -> storage -> GET) for
 * every section. Per-section toggle-to-field wiring is covered by unit tests.
 *
 * PREREQUISITE: PERPS_ENABLED=true in the extension build so the perps
 * notification preference section is included (enabled by default in test builds).
 */
describe('Notification Preferences Sections', function () {
  it('persists section in-app notification preferences to authenticated user storage', async function () {
    const triggerServer = new MockttpNotificationTriggerServer();
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          await mockNotificationServices(server, triggerServer);
          await mockFeatureFlagsWithoutAutoEnableNotifications(server);
        },
      },
      async ({ driver }) => {
        await login(driver);
        // Notifications are enabled by default in the fixture, so we navigate
        // straight to the notifications settings page.
        await goToNotificationsSettingsPage(driver);

        const notificationsSettingsPage = new NotificationsSettingsPage(driver);

        // Flip the perps in-app toggle and capture the new expected state.
        const initialState =
          await notificationsSettingsPage.getSectionInAppNotificationState(
            'perps',
          );
        const expectedState =
          initialState === 'enabled' ? 'disabled' : 'enabled';
        await notificationsSettingsPage.clickSectionInAppNotificationToggle(
          'perps',
        );
        await notificationsSettingsPage.checkSectionInAppNotificationState({
          section: 'perps',
          expectedState,
        });

        // The toggle was written to authenticated user storage (PUT payload).
        const persistedPreferences = triggerServer.getNotificationPreferences();
        assert.ok(
          persistedPreferences,
          'Section preferences should be persisted to authenticated user storage',
        );
        assert.equal(
          persistedPreferences.perps.inAppNotificationsEnabled,
          expectedState === 'enabled',
        );

        // Re-open Settings > Notifications from a fresh (locked then unlocked)
        // session so the preferences are re-fetched from authenticated user
        // storage rather than read from in-memory state.
        await driver.navigate();
        await lockAndWaitForLoginPage(driver);
        await login(driver);
        await goToNotificationsSettingsPage(driver);
        await notificationsSettingsPage.checkSectionInAppNotificationState({
          section: 'perps',
          expectedState,
        });
      },
    );
  });
});
