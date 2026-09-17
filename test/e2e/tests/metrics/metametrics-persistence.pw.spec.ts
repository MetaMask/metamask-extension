import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getEventPayloads, withFixtures } from '../../helpers';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

type TrackEvent = {
  event: string;
  userId: string;
};

/**
 * Mocks the segment API for the MetaMetrics Turned On event, which is tracked
 * once metrics collection has been re-enabled from the privacy settings.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked endpoints
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          { type: 'track', event: MetaMetricsEventName.TurnOnMetaMetrics },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

pwTest.describe('MetaMetrics ID persistence', () => {
  pwTest(
    'MetaMetrics ID should persist when the user opts-out and then opts-in again of MetaMetrics collection',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);

          // goes to the privacy settings screen and toggles participate in
          // metaMetrics off and then back on
          await new HomePage(driver).headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToPrivacySettings();
          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkPageIsLoaded();
          await privacySettings.toggleParticipateInMetaMetrics({
            targetState: 'off',
          });
          await privacySettings.toggleParticipateInMetaMetrics({
            targetState: 'on',
          });

          // The opt-in event is tracked after metrics collection is re-enabled,
          // so its userId is the ID the extension held on to across the
          // opt-out/opt-in cycle. A regenerated ID would not match the fixture.
          const events: TrackEvent[] = await getEventPayloads(
            driver,
            mockedEndpoints,
          );
          const optInEvents = events.filter(
            (event) => event.event === MetaMetricsEventName.TurnOnMetaMetrics,
          );

          assert.equal(optInEvents.length, 1);
          assert.equal(
            optInEvents[0].userId,
            MOCK_ANALYTICS_ID,
            'MetaMetrics ID should be preserved when toggling metametrics collection off and back on',
          );
        },
      );
    },
  );
});
