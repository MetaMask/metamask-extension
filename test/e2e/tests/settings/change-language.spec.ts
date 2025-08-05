import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const selectors = {
  currentLanguageDansk: { tag: 'p', text: 'Nuværende sprog' },
  currentLanguageDeutsch: { tag: 'p', text: 'Aktuelle Sprache' },
  currentLanguageEnglish: { tag: 'p', text: 'Current language' },
  currentLanguageMagyar: { tag: 'p', text: 'Aktuális nyelv' },
  currentLanguageSpanish: { tag: 'p', text: 'Idioma actual' },
  currentLanguageवर्तमान: { tag: 'p', text: 'वर्तमान भाषा' },
  advanceText: { text: 'Avanceret', tag: 'div' },
  waterText: '[placeholder="Søg"]',
  headerTextDansk: { text: 'Indstillinger', tag: 'h3' },
  buttonText: { css: '[data-testid="auto-lockout-button"]', text: 'Gem' },
  dialogText: { text: 'Empfängeradresse ist unzulässig', tag: 'p' },
  hyperText: { text: 'Tudjon meg többet', tag: 'a' },
  discoverText: { text: 'खोजें', tag: 'a' },
  headerText: { text: 'الإعدادات', tag: 'h3' },
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
        await generalSettings.check_pageIsLoaded();

        // Change language to Spanish and validate that the word has changed correctly
        await generalSettings.changeLanguage('Español');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageSpanish,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        // Refresh the page and validate that the language is still Spanish
        await driver.refresh();
        await generalSettings.check_pageIsLoaded();
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
        await generalSettings.check_pageIsLoaded();

        // Select "Dansk" language
        await generalSettings.changeLanguage('Dansk');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageDansk,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await driver.clickElement(selectors.advanceText);
        const advancedSettings = new AdvancedSettings(driver);
        await advancedSettings.check_pageIsLoaded();

        // Confirm that the language change is reflected in search box water text
        const isWaterTextChanged = await driver.isElementPresent(
          selectors.waterText,
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
          selectors.buttonText,
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
        await generalSettings.check_pageIsLoaded();

        // Select "Deutsch" language
        await generalSettings.changeLanguage('Deutsch');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageDeutsch,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await new SettingsPage(driver).closeSettingsPage();

        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed();
        await homepage.startSendFlow();

        const sendToPage = new SendTokenPage(driver);
        await sendToPage.check_pageIsLoaded();
        // use wrong address for recipient to allow error message to show
        await sendToPage.fillRecipient(
          '0xAAAA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );

        // Validate the language change is reflected in the dialog message
        const isDialogMessageChanged = await driver.isElementPresent(
          selectors.dialogText,
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
        await generalSettings.check_pageIsLoaded();

        // Select "मानक हिन्दी" language
        await generalSettings.changeLanguage('मानक हिन्दी');

        const isLabelTextChanged = await driver.isElementPresent(
          selectors.currentLanguageवर्तमान,
        );
        assert.equal(isLabelTextChanged, true, 'Language did not change');

        await new SettingsPage(driver).closeSettingsPage();
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed();
        const isDiscoverButtonTextChanged = await driver.isElementPresent(
          selectors.discoverText,
        );
        assert.equal(
          isDiscoverButtonTextChanged,
          true,
          'Language change is not reflected in headers',
        );
      },
    );
  });

  it('validate "Magyar" language change on hypertext', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.check_pageIsLoaded();

        // Select "Magyar" language
        await generalSettings.changeLanguage('Magyar');
        const isLabelTextChanged = await driver.isElementPresent(
          selectors.currentLanguageMagyar,
        );
        assert.equal(isLabelTextChanged, true, 'Language did not change');

        await new SettingsPage(driver).closeSettingsPage();
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed();
        await homepage.goToNftTab();

        // Validate the hypertext
        const isHyperTextChanged = await driver.isElementPresent(
          selectors.hyperText,
        );
        assert.equal(
          isHyperTextChanged,
          true,
          'Language change is not reflected on hypertext',
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
        await generalSettings.check_pageIsLoaded();

        // Select "العربية" language and validate that the header text has changed
        await generalSettings.changeLanguage('العربية');

        const isHeaderTextChanged = await driver.isElementPresent(
          selectors.headerText,
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
