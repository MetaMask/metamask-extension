import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import packageJson from '../../../../package.json';
import AboutPage from '../../page-objects/pages/settings/about-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';

// Test case to validate the view in the "About" - MetaMask.
pwTest.describe('Setting - About MetaMask :', () => {
  pwTest(
    'validate the view',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await login(driver);

          // navigate to settings and click on about page
          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToAboutPage();

          const aboutPage = new AboutPage(driver);
          await aboutPage.checkPageIsLoaded();

          // verify the version number of MetaMask
          const { version } = packageJson;
          await aboutPage.checkMetaMaskVersionNumber(version);

          // click on `close` button
          await closeSettings(driver);

          // wait for home page and validate the balance
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();
        },
      );
    },
  );
});
