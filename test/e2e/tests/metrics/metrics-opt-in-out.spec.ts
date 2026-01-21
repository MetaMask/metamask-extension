import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { MOCK_META_METRICS_ID, WALLET_PASSWORD } from '../../constants';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';

/**
 * Mocks the segment API multiple times for specific payloads that we expect to
 * see when these tests are run. In this case, we are looking for
 * 'App Installed'. Do not use the constants from the metrics constants files,
 * because if these change we want a strong indicator to our data team that the
 * shape of data will change.
 *
 * @param mockServer - The mock server instance.
 * @returns
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Metrics Opt In',
            properties: {
              category: 'App',
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
            event: 'Metrics Opt Out',
            properties: {
              category: 'App',
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

describe('Metrics Opt In/Out events', function () {
  it('should be tracked when the user opts in to metrics', async function () {
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
        await driver.navigate();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          await onboardingMetricsPage.clickOnContinueButton();
        }

        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp();

        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        await secureWalletPage.revealAndConfirmSRP();

        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          await onboardingMetricsPage.clickOnContinueButton();
        }

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].event, 'Metrics Opt In');
      },
    );
  });

  it('should be tracked when the user opts out of metrics', async function () {
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
        await driver.navigate();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          // Opt out of metrics
          // Metrics is Opt In by default, by clicking the checkbox again, we opt out
          await onboardingMetricsPage.clickParticipateInMetaMetricsCheckbox();
          await onboardingMetricsPage.clickOnContinueButton();
        }

        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp();

        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        await secureWalletPage.revealAndConfirmSRP();

        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.checkPageIsLoaded();
          // Opt out of metrics
          // Metrics is Opt In by default, by clicking the checkbox again, we opt out
          await onboardingMetricsPage.clickParticipateInMetaMetricsCheckbox();
          await onboardingMetricsPage.clickOnContinueButton();
        }

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].event, 'Metrics Opt Out');
      },
    );
  });
});
