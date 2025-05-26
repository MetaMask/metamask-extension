import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import packageJson from '../../../../package.json';
import AboutPage from '../../page-objects/pages/settings/about-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

// Test case to validate the view in the "About" - MetaMask.
describe('Setting - About MetaMask :', function (this: Suite) {
  it('validate the view', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // navigate to settings and click on about page
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToAboutPage();

        const aboutPage = new AboutPage(driver);
        await aboutPage.check_pageIsLoaded();

        // verify the version number of MetaMask
        const { version } = packageJson;
        await aboutPage.check_metaMaskVersionNumber(version);

        // click on `close` button
        await settingsPage.closeSettingsPage();

        // wait for home page and validate the balance
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();
      },
    );
  });
});
