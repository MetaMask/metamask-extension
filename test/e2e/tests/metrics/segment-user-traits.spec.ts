import { strict as assert } from 'assert';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  completeCreateNewWalletOnboardingFlow,
  createNewWalletOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { MOCK_META_METRICS_ID } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';

type IdentifyEvent = { traits: Record<string, unknown> };

function mergeTraits(events: IdentifyEvent[]): Record<string, unknown> {
  return events.reduce(
    (acc, event) => ({ ...acc, ...event.traits }),
    {} as Record<string, unknown>,
  );
}

/**
 * Poll getEventPayloads until the merged traits satisfy every key/value in `expected`.
 * Throws TimeoutError if the traits don't converge within the timeout window.
 *
 * @param driver - The WebDriver instance.
 * @param driver.wait - Polls a condition function until it returns true or the timeout expires.
 * @param mockedEndpoints - The mockttp mocked endpoints to retrieve seen requests from.
 * @param expected - Key/value pairs that the merged traits must satisfy.
 * @param timeout - Maximum time in ms to wait for the traits to converge.
 */
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

describe('Segment User Traits', function () {
  it('sends identify event when user opts in both metrics and data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
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
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_metrics_opted_in: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_marketing_consent: true,
        });
      },
    );
  });

  it('sends identify event when user opts into metrics but not data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
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
        await waitForExpectedTraits(driver, mockedEndpoints, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_metrics_opted_in: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_marketing_consent: false,
        });
      },
    );
  });

  it('will not send identify event when user opts out of both metrics and data collection during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
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
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: false,
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
        });
      },
    );
  });

  it('sends identify event when user opts in both metrics and data in privacy settings after opting out during onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: false,
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
        });
      },
    );
  });
});
