import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { login } from '../../page-objects/flows/login.flow';
import { withFixtures, getEventPayloads } from '../../helpers';
import { MOCK_ANALYTICS_ID, NETWORK_CLIENT_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';

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
              settings_type: 'basic_functionality',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              old_value: true,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              new_value: false,
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
            analyticsId: MOCK_ANALYTICS_ID,
            consentDecisionMade: true,
            optedIn: true,
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
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();

        await privacySettings.toggleBasicFunctionalityOff();

        const events = await getEventPayloads(driver, mockedEndpoints);

        const toggleOffEvent = {
          event: 'Settings Updated',
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            settings_type: 'basic_functionality',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            old_value: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_value: false,
            category: 'Settings',
          },
          userId: MOCK_ANALYTICS_ID,
          type: 'track',
        };
        const matchToggleOffEvent = {
          event: events[0].event,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            settings_type: events[0].properties.settings_type,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            old_value: events[0].properties.old_value,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_value: events[0].properties.new_value,
            category: events[0].properties.category,
          },
          userId: events[0].userId,
          type: events[0].type,
        };

        assert.equal(events.length, 1);
        assert.deepEqual(toggleOffEvent, matchToggleOffEvent);
      },
    );
  });
});
