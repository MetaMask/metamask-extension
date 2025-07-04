import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import { MOCK_META_METRICS_ID, WALLET_PASSWORD } from '../../constants';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';

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
            event: 'App Installed',
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

describe('App Installed Events', function () {
  it('are sent immediately when user installs app and chooses to opt in metrics', async function () {
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
        await driver.navigate();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.check_pageIsLoaded();
          await onboardingMetricsPage.clickIAgreeButton();
        }

        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.check_bannerPageIsLoaded();
        await startOnboardingPage.agreeToTermsOfUse();
        await startOnboardingPage.check_loginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp();

        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.check_pageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.check_pageIsLoaded();
        await secureWalletPage.revealAndConfirmSRP();

        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.check_pageIsLoaded();
          await onboardingMetricsPage.clickIAgreeButton();
        }

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].properties, {
          category: 'App',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
        });
      },
    );
  });

  it('are not sent when user installs app and chooses to opt out metrics', async function () {
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
          await onboardingMetricsPage.check_pageIsLoaded();
          await onboardingMetricsPage.clickNoThanksButton();
        }

        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.check_bannerPageIsLoaded();
        await startOnboardingPage.agreeToTermsOfUse();
        await startOnboardingPage.check_loginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp();

        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.check_pageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.check_pageIsLoaded();
        await secureWalletPage.revealAndConfirmSRP();

        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.check_pageIsLoaded();
          await onboardingMetricsPage.clickNoThanksButton();
        }

        const mockedRequests = await getEventPayloads(
          driver,
          mockedEndpoints,
          false,
        );
        assert.equal(mockedRequests.length, 0);
      },
    );
  });
});
