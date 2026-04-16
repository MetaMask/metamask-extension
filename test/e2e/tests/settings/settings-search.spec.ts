import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AboutPage from '../../page-objects/pages/settings/about-page';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

describe('Settings Search', function () {
  const settingsSearch = {
    assets: 'Show native token as main balance',
    privacy: 'State logs',
    securityAndPassword: 'Manage wallet recovery',
    experimental: 'Add account Snap',
    about: 'Terms of Use',
  };

  it('should find element inside the Assets page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });

  it('should find element inside the Privacy page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });

  it('should find element inside the Security and password page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });

  it('should find element inside the Experimental page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput(settingsSearch.experimental);

        // Check if element redirects to the correct page
        await settingsPage.goToSearchResultPage('Experimental');
        await new ExperimentalSettings(driver).checkPageIsLoaded();
      },
    );
  });

  it('should find element inside the About MetaMask page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });

  it('should display "No matching results found" for a non-existing element', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
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
  });
});
