import { Mockttp, MockedEndpoint } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { MOCK_ANALYTICS_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';

type IdentifyEvent = { traits: Record<string, unknown> };

function mergeTraits(events: IdentifyEvent[]): Record<string, unknown> {
  return events.reduce(
    (acc, event) => ({ ...acc, ...event.traits }),
    {} as Record<string, unknown>,
  );
}

async function waitForExpectedTraits(
  driver: {
    wait: (condition: () => Promise<boolean>, timeout: number) => Promise<void>;
  },
  mockedEndpoints: MockedEndpoint[],
  expected: Record<string, unknown>,
  timeout = 30_000,
): Promise<Record<string, unknown>> {
  let events: IdentifyEvent[] = [];
  await driver.wait(async () => {
    try {
      events = await getEventPayloads(driver, mockedEndpoints, false);
    } catch {
      return false;
    }
    if (events.length === 0) {
      return false;
    }
    const traits = mergeTraits(events);
    return Object.entries(expected).every(
      ([key, value]) => traits[key] === value,
    );
  }, timeout);
  return mergeTraits(events);
}

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'identify' }],
      })
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('NFT Autodetection Enabled', function () {
  it('sends identify trait when NFT autodetection is toggled in Assets settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .withPreferencesController({
            useNftDetection: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToAssetsSettings();

        const assetsSettings = new PreferencesAndDisplaySettings(driver);
        await assetsSettings.checkAssetsPageIsLoaded();

        // Default is enabled; toggle off and assert the identify trait update.
        await assetsSettings.toggleAutodetectNfts();
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          nft_autodetection_enabled: false,
        });

        // Toggle back on and assert the identify trait update.
        await assetsSettings.toggleAutodetectNfts();
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          nft_autodetection_enabled: true,
        });
      },
    );
  });
});
