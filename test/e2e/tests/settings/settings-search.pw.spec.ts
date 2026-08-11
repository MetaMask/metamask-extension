import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AboutPage from '../../page-objects/pages/settings/about-page';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

pwTest.describe('Settings Search', () => {
  const settingsSearch = {
    assets: 'Show native token as main balance',
    privacy: 'State logs',
    securityAndPassword: 'Manage wallet recovery',
    experimental: 'Add account Snap',
    about: 'Terms of Use',
  };

  pwTest(
    'should find element inside the Assets page',
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

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.fillSearchSettingsInput(settingsSearch.assets);

          await settingsPage.goToSearchResultPage('Assets');
          await new PreferencesAndDisplaySettings(
            driver,
          ).checkAssetsPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should find element inside the Privacy page',
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

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.fillSearchSettingsInput(settingsSearch.privacy);

          await settingsPage.goToSearchResultPage('Privacy');
          await new PrivacySettings(driver).checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should find element inside the Security and password page',
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

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.fillSearchSettingsInput(
            settingsSearch.securityAndPassword,
          );

          await settingsPage.goToSearchResultPage('Security and password');
          await new PrivacySettings(
            driver,
          ).checkSecurityAndPasswordPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should find element inside the Experimental page',
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

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.fillSearchSettingsInput(
            settingsSearch.experimental,
          );

          // Check if element redirects to the correct page
          await settingsPage.goToSearchResultPage('Experimental');
          await new ExperimentalSettings(driver).checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should find element inside the About MetaMask page',
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

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.fillSearchSettingsInput(settingsSearch.about);

          // Check if element redirects to the correct page
          await settingsPage.goToSearchResultPage('About MetaMask');
          await new AboutPage(driver).checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should display "No matching results found" for a non-existing element',
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

          await new HeaderNavbar(driver).openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.fillSearchSettingsInput('Lorem ipsum');
          await settingsPage.checkNoMatchingResultsFoundMessageIsDisplayed();
        },
      );
    },
  );
});
