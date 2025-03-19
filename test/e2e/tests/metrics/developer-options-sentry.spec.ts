import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { withFixtures, sentryRegEx } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import DevelopOptions from '../../page-objects/pages/developer-options-page';
import ErrorPage from '../../page-objects/pages/error-page';

const triggerCrash = async (driver: Driver): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.check_pageIsLoaded();
  await settingsPage.goToDevelopOptionSettings();

  const developOptionsPage = new DevelopOptions(driver);
  await developOptionsPage.check_pageIsLoaded();
  await developOptionsPage.clickGenerateCrashButton();
};

async function mockSentryError(mockServer: MockttpServer) {
  return [
    await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding('feedback')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      }),
  ];
}

describe('Developer Options - Sentry', function (this: Suite) {
  it('gives option to cause a page crash and provides sentry form to report', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSentryError,
        ignoredConsoleErrors: [
          'Error#1: Unable to find value of key "developerOptions" for locale "en"',
          'React will try to recreate this component tree from scratch using the error boundary you provided, Index.',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await triggerCrash(driver);
        const errorPage = new ErrorPage(driver);
        await errorPage.check_pageIsLoaded();
        await errorPage.validate_errorMessage();
        await errorPage.submitToSentryUserFeedbackForm();
        await errorPage.waitForSentrySuccessModal();
      },
    );
  });

  it('gives option to cause a page crash and offer contact support option', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: [
          'Error#1: Unable to find value of key "developerOptions" for locale "en"',
          'React will try to recreate this component tree from scratch using the error boundary you provided, Index.',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await triggerCrash(driver);

        const errorPage = new ErrorPage(driver);
        await errorPage.check_pageIsLoaded();

        await errorPage.contactAndValidateMetaMaskSupport();
      },
    );
  });
});
