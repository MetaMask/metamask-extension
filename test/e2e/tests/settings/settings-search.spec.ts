import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AboutPage from '../../page-objects/pages/settings/about-page';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import ContactsSettings from '../../page-objects/pages/settings/contacts-settings';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Settings Search', function () {
  const settingsSearch = {
    general: 'Show native token as main balance',
    advanced: 'State logs',
    contacts: 'Contacts',
    security: 'Reveal Secret',
    experimental: 'Snaps',
    about: 'Terms of Use',
  };

  it('should find element inside the General tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput(settingsSearch.general);

        // navigate to general settings
        await settingsPage.goToSearchResultPage('General');
        await new GeneralSettings(driver).checkPageIsLoaded();
      },
    );
  });

  it('should find element inside the Advanced tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput(settingsSearch.advanced);

        // Check if element redirects to the correct page
        await settingsPage.goToSearchResultPage('Advanced');
        await new AdvancedSettings(driver).checkPageIsLoaded();
      },
    );
  });

  it('should find element inside the Contacts tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput(settingsSearch.contacts);

        // Check if element redirects to the correct page
        await settingsPage.goToSearchResultPage('Contacts');
        await new ContactsSettings(driver).checkPageIsLoaded();
      },
    );
  });

  it('should find element inside the "Security & privacy" tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput(settingsSearch.security);

        // Check if element redirects to the correct page
        await settingsPage.goToSearchResultPage('Security');
        await new PrivacySettings(driver).checkPageIsLoaded();
      },
    );
  });

  it('should find element inside the Experimental tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

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

  it('should find element inside the About tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput(settingsSearch.about);

        // Check if element redirects to the correct page
        await settingsPage.goToSearchResultPage('About');
        await new AboutPage(driver).checkPageIsLoaded();
      },
    );
  });

  it('should display "No matching results found" for a non-existing element', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.fillSearchSettingsInput('Lorem ipsum');
        await settingsPage.checkNoMatchingResultsFoundMessageIsDisplayed();
      },
    );
  });
});
