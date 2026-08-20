import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  completeCreateNewWalletOnboardingFlow,
  createNewWalletOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { MOCK_ANALYTICS_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { waitForExpectedTraits } from './helpers';

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

describe('Segment User Traits', function () {
  it('sends identify event when user opts in both metrics and data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({
          driver,
          consentDecisionMade: true,
          optedIn: true,
          dataCollectionForMarketing: true,
        });
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_metrics_opted_in: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_marketing_consent: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask',
        });
      },
    );
  });

  it('sends identify event when user opts into metrics but not data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({
          driver,
          consentDecisionMade: true,
          optedIn: true,
          dataCollectionForMarketing: false,
        });
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_metrics_opted_in: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_marketing_consent: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask',
        });
      },
    );
  });

  it('will not send identify event when user opts out of both metrics and data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await createNewWalletOnboardingFlow({
          driver,
          consentDecisionMade: true,
          optedIn: false,
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
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          consentDecisionMade: true,
          optedIn: false,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleParticipateInMetaMetrics();
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_metrics_opted_in: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_marketing_consent: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask',
        });
      },
    );
  });

  it('sends identify event when user opts in both metrics and data in privacy settings after opting out during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          consentDecisionMade: true,
          optedIn: false,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleParticipateInMetaMetrics();
        await privacySettings.toggleDataCollectionForMarketing();
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_metrics_opted_in: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_marketing_consent: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask',
        });
      },
    );
  });
});
