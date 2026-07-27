import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
  getEventPayloads,
  isSidePanelEnabled,
  withFixtures,
} from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  MOCK_ANALYTICS_ID,
  MOCK_DOWNSTREAM_EVENT_ENRICHMENT_PROPERTIES,
} from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import {
  clickNotificationItemAndDetailsPage,
  goToNotificationsList,
} from '../../page-objects/flows/notifications.flow';
import { MockttpNotificationTriggerServer } from '../../helpers/notifications/mock-notification-trigger-server';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import {
  getMockWalletNotificationItemId,
  mockNotificationServices,
} from '../notifications/mocks';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Notification Clicked' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

async function mockFeatureFlagsWithoutAutoEnableNotifications(server: Mockttp) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  await server
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

describe('Notification Clicked Event', function (this: Suite) {
  it('is sent when a notification list item is clicked', async function () {
    const notificationId = getMockWalletNotificationItemId(
      TRIGGER_TYPES.ETH_SENT,
    );

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // Notification/feature-flag mocks are not returned so getEventPayloads
          // only waits on the Segment endpoint below.
          await mockNotificationServices(
            server,
            new MockttpNotificationTriggerServer(),
          );
          await mockFeatureFlagsWithoutAutoEnableNotifications(server);
          return mockSegment(server);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        await goToNotificationsList(driver);
        await clickNotificationItemAndDetailsPage(driver, notificationId);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].event, 'Notification Clicked');

        const expectedEnvironmentType = (await isSidePanelEnabled())
          ? 'sidepanel'
          : 'fullscreen';

        const {
          // Omit the full notification blob; assert identity fields separately.
          data,
          ...eventProperties
        } = events[0].properties;

        assert.deepStrictEqual(eventProperties, {
          category: 'Notification Interaction',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          /* eslint-disable @typescript-eslint/naming-convention */
          notification_id: notificationId,
          notification_type: 'eth_sent',
          previously_read: false,
          environment_type: expectedEnvironmentType,
          /* eslint-enable @typescript-eslint/naming-convention */
          ...MOCK_DOWNSTREAM_EVENT_ENRICHMENT_PROPERTIES,
        });
        assert.equal(data.id, notificationId);
        assert.equal(data.type, 'eth_sent');
        assert.equal(data.payload.chain_id, 1);
      },
    );
  });
});
