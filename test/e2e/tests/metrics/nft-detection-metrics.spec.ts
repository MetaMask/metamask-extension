import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { login } from '../../page-objects/flows/login.flow';
import { MOCK_ANALYTICS_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import { waitForExpectedTraits } from './helpers';

/**
 * Mocks Segment identify calls. Do not use the constants from the metrics
 * constants files, because if these change we want a strong indicator to our
 * data team that the shape of data will change.
 *
 * @param mockServer - The mock server instance.
 */
async function mockSegmentIdentify(mockServer: Mockttp) {
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

describe('Nft detection event', function () {
  it('sends identify trait with nft_autodetection_enabled during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegmentIdentify,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          consentDecisionMade: true,
          optedIn: true,
        });

        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          nft_autodetection_enabled: true,
        });
      },
    );
  });

  it('sends identify trait when NFT autodetection is toggled in Assets settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            consentDecisionMade: true,
            optedIn: true,
          })
          .withPreferencesController({
            useNftDetection: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegmentIdentify,
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
