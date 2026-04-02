import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { login } from '../../page-objects/flows/login.flow';
import { withFixtures, getEventPayloads } from '../../helpers';
import { MOCK_META_METRICS_ID, NETWORK_CLIENT_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import TransactionsSettingsPage from '../../page-objects/pages/settings/transactions-settings';

async function mockServerCalls(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Settings Updated',
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              blockaid_alerts_enabled: true,
              category: 'Settings',
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Settings Updated',
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              blockaid_alerts_enabled: false,
              category: 'Settings',
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('PPOM Blockaid Alert - Metrics', function () {
  it('Successfully track button toggle on/off', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withPermissionControllerConnectedToTestDapp({
            useLocalhostHostname: true,
            chainIds: [1],
          })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockServerCalls,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToTransactionsSettings();

        const transactionsSettingsPage = new TransactionsSettingsPage(driver);
        await transactionsSettingsPage.waitForSecurityAlertsSection();

        const privacySettings = new PrivacySettings(driver);
        // Default fixture has security alerts enabled; first click turns them off.
        await privacySettings.toggleBlockaidAlerts();

        // wait for state to update
        await driver.delay(1000);

        // Second click turns security alerts back on.
        await privacySettings.toggleBlockaidAlerts();

        await driver.delay(1000);

        const events = await getEventPayloads(driver, mockedEndpoints);

        const toggleOnEvent = {
          event: 'Settings Updated',
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            blockaid_alerts_enabled: true,
            category: 'Settings',
          },
          userId: MOCK_META_METRICS_ID,
          type: 'track',
        };
        const matchToggleOnEvent = {
          event: events[0].event,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            blockaid_alerts_enabled:
              events[0].properties.blockaid_alerts_enabled,
            category: events[0].properties.category,
          },
          userId: events[0].userId,
          type: events[0].type,
        };

        const toggleOffEvent = {
          event: 'Settings Updated',
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            blockaid_alerts_enabled: false,
            category: 'Settings',
          },
          userId: MOCK_META_METRICS_ID,
          type: 'track',
        };
        const matchToggleOffEvent = {
          event: events[1].event,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            blockaid_alerts_enabled:
              events[1].properties.blockaid_alerts_enabled,
            category: events[1].properties.category,
          },
          userId: events[1].userId,
          type: events[1].type,
        };

        assert.equal(events.length, 2);
        assert.deepEqual(toggleOnEvent, matchToggleOnEvent);
        assert.deepEqual(toggleOffEvent, matchToggleOffEvent);
      },
    );
  });
});
