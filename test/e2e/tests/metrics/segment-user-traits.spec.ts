import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import {
  completeCreateNewWalletOnboardingFlow,
  createNewWalletOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { MOCK_META_METRICS_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'identify' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Segment User Traits', function () {
  it('sends identify event when user opts in both metrics and data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
          dataCollectionForMarketing: true,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].traits.is_metrics_opted_in, true);
        assert.deepStrictEqual(events[0].traits.has_marketing_consent, true);
      },
    );
  });

  it('sends identify event when user opts into metrics but not data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
          dataCollectionForMarketing: false,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].traits.is_metrics_opted_in, true);
        assert.deepStrictEqual(events[0].traits.has_marketing_consent, false);
      },
    );
  });

  it('will not send identify event when user opts out of both metrics and data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: false,
          dataCollectionForMarketing: false,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
      },
    );
  });

  it('sends identify event when user enables metrics in privacy settings after opting out during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        let events = [];
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: false,
        });
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleParticipateInMetaMetrics();
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].traits.is_metrics_opted_in, true);
        assert.deepStrictEqual(events[0].traits.has_marketing_consent, false);
      },
    );
  });

  it('sends identify event when user opts in both metrics and data in privacy settings after opting out during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        let events = [];
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: false,
        });
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleDataCollectionForMarketing();
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].traits.is_metrics_opted_in, true);
        assert.deepStrictEqual(events[0].traits.has_marketing_consent, true);
      },
    );
  });
});
