import { Mockttp } from 'mockttp';
import { login } from '../../page-objects/flows/login.flow';
import { withFixtures } from '../../helpers';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { enableNotificationsThroughSettingsPage } from '../../page-objects/flows/notifications.flow';
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
 * PREREQUISITE: PERPS_ENABLED=true in the extension build so the perps
 * notification preference section is included (enabled by default in test builds).
 */
describe('Notification Preferences Sections', function () {
  it('lists all notification preference sections and navigates to perps and agentic cli', async function () {
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
        await login(driver, { validateBalance: false });
        await enableNotificationsThroughSettingsPage(driver);

        const notificationsSettingsPage = new NotificationsSettingsPage(driver);
        await notificationsSettingsPage.assertNotificationPreferenceSectionsListed();

        await notificationsSettingsPage.navigateToNotificationPreferenceSection(
          'perps',
        );
        await notificationsSettingsPage.navigateToNotificationPreferenceSection(
          'agenticCli',
        );

        const initialPerpsState =
          await notificationsSettingsPage.getSectionInAppNotificationState(
            'perps',
          );
        await notificationsSettingsPage.clickSectionInAppNotificationToggle(
          'perps',
        );
        await notificationsSettingsPage.checkSectionInAppNotificationState({
          section: 'perps',
          expectedState:
            initialPerpsState === 'enabled' ? 'disabled' : 'enabled',
        });

        const initialAgenticCliState =
          await notificationsSettingsPage.getSectionInAppNotificationState(
            'agenticCli',
          );
        await notificationsSettingsPage.clickSectionInAppNotificationToggle(
          'agenticCli',
        );
        await notificationsSettingsPage.checkSectionInAppNotificationState({
          section: 'agenticCli',
          expectedState:
            initialAgenticCliState === 'enabled' ? 'disabled' : 'enabled',
        });
      },
    );
  });
});
