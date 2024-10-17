import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import DevelopOptions from '../../page-objects/pages/developer-options-page';
import ErrorPage from '../../page-objects/pages/ErrorPage';

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

describe('Developer Options - Sentry', function (this: Suite) {
  it('gives option to cause a page crash and provides sentry form to report', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: ['ignore-all'],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await triggerCrash(driver);
        const errorPage = new ErrorPage(driver);
        await errorPage.check_pageIsLoaded();
        await errorPage.validate_errorMessage();
        await errorPage.submitToSentryUserFeedbackForm();
      },
    );
  });

  it('gives option to cause a page crash and offer contact support option', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: ['ignore-all'],
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
