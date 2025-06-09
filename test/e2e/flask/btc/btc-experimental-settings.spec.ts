import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('BTC Experimental Settings', function (this: Suite) {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('will show `Add a new Bitcoin account (Beta)` option when setting is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // go to experimental settings page and enable add new Bitcoin account toggle
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.check_pageIsLoaded();
        await experimentalSettings.toggleBitcoinAccount();
        await settingsPage.closeSettingsPage();

        // check add new Bitcoin account button is displayed
        await homePage.check_pageIsLoaded();
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_addBitcoinAccountAvailable(true);
      },
    );
  });
});
