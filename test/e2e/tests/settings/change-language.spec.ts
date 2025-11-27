import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ar from '../../../../app/_locales/ar/messages.json';
import da from '../../../../app/_locales/da/messages.json';
import de from '../../../../app/_locales/de/messages.json';
import en from '../../../../app/_locales/en/messages.json';
import hu from '../../../../app/_locales/hu/messages.json';
import es from '../../../../app/_locales/es/messages.json';
import hi from '../../../../app/_locales/hi/messages.json';

const selectors = {
  currentLanguageDansk: { tag: 'p', text: da.currentLanguage.message },
  currentLanguageDeutsch: { tag: 'p', text: de.currentLanguage.message },
  currentLanguageEnglish: { tag: 'p', text: en.currentLanguage.message },
  currentLanguageMagyar: { tag: 'p', text: hu.currentLanguage.message },
  currentLanguageSpanish: { tag: 'p', text: es.currentLanguage.message },
  currentLanguageवर्तमान: { tag: 'p', text: hi.currentLanguage.message },
  advanceTextDansk: { text: da.advanced.message, tag: 'div' },
  waterTextDansk: `[placeholder="${da.search.message}"]`,
  headerTextDansk: { text: da.settings.message, tag: 'h3' },
  buttonTextDansk: {
    css: '[data-testid="auto-lockout-button"]',
    text: da.save.message,
  },
  dialogTextDeutsch: { text: de.invalidAddressRecipient.message, tag: 'p' },
  discoverTextवर्तमान: { text: hi.discover.message, tag: 'a' },
  headerTextAr: { text: ar.settings.message, tag: 'h3' },
};

describe('Settings - general tab', function (this: Suite) {
  it('validate the change language functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();

        // Change language to Spanish and validate that the word has changed correctly
        await generalSettings.changeLanguage('Español');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageSpanish,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        // Refresh the page and validate that the language is still Spanish
        await driver.refresh();
        await generalSettings.checkPageIsLoaded();
        assert.equal(
          await driver.isElementPresent(selectors.currentLanguageSpanish),
          true,
          'Language did not change after refresh',
        );

        // Change language back to English and validate that the word has changed correctly
        await generalSettings.changeLanguage('English');
        const isLabelTextChanged = await driver.isElementPresent(
          selectors.currentLanguageEnglish,
        );
        assert.equal(isLabelTextChanged, true, 'Language did not change');
      },
    );
  });

  it('validate "Dansk" language on page navigation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();

        // Select "Dansk" language
        await generalSettings.changeLanguage('Dansk');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageDansk,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await driver.clickElement(selectors.advanceTextDansk);
        const advancedSettings = new AdvancedSettings(driver);
        await advancedSettings.checkPageIsLoaded();

        // Confirm that the language change is reflected in search box water text
        const isWaterTextChanged = await driver.isElementPresent(
          selectors.waterTextDansk,
        );
        assert.equal(
          isWaterTextChanged,
          true,
          'Water text in the search box does not match with the selected language',
        );

        // Confirm that the language change is reflected in headers
        const isHeaderTextChanged = await driver.isElementPresent(
          selectors.headerTextDansk,
        );
        assert.equal(
          isHeaderTextChanged,
          true,
          'Language change is not reflected in headers',
        );

        // Confirm that the language change is reflected in button
        const isButtonTextChanged = await driver.isElementPresent(
          selectors.buttonTextDansk,
        );
        assert.equal(
          isButtonTextChanged,
          true,
          'Language change is not reflected in button',
        );
      },
    );
  });

  it('validate "Deutsch" language on error messages', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();

        // Select "Deutsch" language
        await generalSettings.changeLanguage('Deutsch');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageDeutsch,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await new SettingsPage(driver).closeSettingsPage();

        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.startSendFlow();

        const sendToPage = new SendTokenPage(driver);
        await sendToPage.checkPageIsLoaded();
        // use wrong address for recipient to allow error message to show
        await sendToPage.fillRecipient(
          '0xAAAA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );

        // Validate the language change is reflected in the dialog message
        const isDialogMessageChanged = await driver.isElementPresent(
          selectors.dialogTextDeutsch,
        );
        assert.equal(
          isDialogMessageChanged,
          true,
          'Language change is not reflected in dialog message',
        );
      },
    );
  });

  it('validate "मानक हिन्दी" language on tooltips', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();

        // Select "मानक हिन्दी" language
        await generalSettings.changeLanguage('मानक हिन्दी');

        const isLabelTextChanged = await driver.isElementPresent(
          selectors.currentLanguageवर्तमान,
        );
        assert.equal(isLabelTextChanged, true, 'Language did not change');

        await new SettingsPage(driver).closeSettingsPage();
        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        const isDiscoverButtonTextChanged = await driver.isElementPresent(
          selectors.discoverTextवर्तमान,
        );
        assert.equal(
          isDiscoverButtonTextChanged,
          true,
          'Language change is not reflected in headers',
        );
      },
    );
  });

  it('validate "العربية" language change on page indent', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();

        // Select "العربية" language and validate that the header text has changed
        await generalSettings.changeLanguage('العربية');

        const isHeaderTextChanged = await driver.isElementPresent(
          selectors.headerTextAr,
        );
        assert.equal(
          isHeaderTextChanged,
          true,
          'Language change is not reflected in headers',
        );
      },
    );
  });
});
