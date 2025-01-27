import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import {
  completeCreateNewWalletOnboardingFlow,
  createNewWalletOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import SecurityAndPrivacySettings from '../../page-objects/pages/settings/security-and-privacy-settings';
import { MOCK_META_METRICS_ID } from '../../constants';

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

describe('segment-user-traits', function () {
  it('send identify event with traits during onboarding if user has opted in to participate in meta metrics and data collection', async function () {
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

  it('send identify event with traits during onboarding if user has opted in to participate in meta metrics but not data collection', async function () {
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

  it('will not send identify event with traits during onboarding if user has opted out of meta metrics and data collection', async function () {
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

  it('send identify event with traits after changing in privacy settings if user has opted out of meta metrics and data collection during onboarding', async function () {
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
        const securityAndPrivacySettings = new SecurityAndPrivacySettings(
          driver,
        );
        await securityAndPrivacySettings.navigateToPage();
        await securityAndPrivacySettings.toggleParticipateInMetaMetrics();
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].traits.is_metrics_opted_in, true);
        assert.deepStrictEqual(events[0].traits.has_marketing_consent, false);
      },
    );
  });

  it('stop sending identify event with traits after opt out meta metrics in privacy settings if user has opted in to participate in meta metrics and data collection during onboarding', async function () {
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
        let events = [];
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
          dataCollectionForMarketing: true,
        });
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        const securityAndPrivacySettings = new SecurityAndPrivacySettings(
          driver,
        );
        await securityAndPrivacySettings.navigateToPage();
        await securityAndPrivacySettings.toggleParticipateInMetaMetrics();
        events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
      },
    );
  });
});
