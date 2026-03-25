import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import ar from '../../../../app/_locales/ar/messages.json';
import da from '../../../../app/_locales/da/messages.json';
import de from '../../../../app/_locales/de/messages.json';
import en from '../../../../app/_locales/en/messages.json';
import hu from '../../../../app/_locales/hu/messages.json';
import es from '../../../../app/_locales/es/messages.json';
import hi from '../../../../app/_locales/hi/messages.json';
import SendPage from '../../page-objects/pages/send/send-page';

const selectors = {
  currentLanguageDansk: { text: 'Dansk' },
  currentLanguageDeutsch: { text: 'Deutsch' },
  currentLanguageEnglish: { text: 'English' },
  currentLanguageMagyar: { text: 'Magyar' },
  currentLanguageSpanish: { text: 'Español' },
  currentLanguageवर्तमान: { text: 'मानक हिन्दी' },
  waterTextDansk: `[placeholder="${da.search.message}"]`,
  headerTextDansk: { text: da.settings.message.trim() },
  dialogTextDeutsch: { text: de.invalidAddress.message, tag: 'p' },
  discoverTextवर्तमान: { text: hi.discover.message, tag: 'a' },
  headerTextAr: { text: ar.settings.message },
};

describe('Settings V2 - Preferences and display', function (this: Suite) {
  it('validates language changes from preferences and display', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const preferencesAndDisplaySettings =
          new PreferencesAndDisplaySettings(driver);
        await preferencesAndDisplaySettings.checkPageIsLoaded();

        await preferencesAndDisplaySettings.changeLanguage('Español');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageSpanish,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await driver.refresh();
        await preferencesAndDisplaySettings.checkPageIsLoaded();
        assert.equal(
          await driver.isElementPresent(selectors.currentLanguageSpanish),
          true,
          'Language did not change after refresh',
        );

        await preferencesAndDisplaySettings.changeLanguage('English');
        const isLabelTextChanged = await driver.isElementPresent(
          selectors.currentLanguageEnglish,
        );
        assert.equal(isLabelTextChanged, true, 'Language did not change');
      },
    );
  });

  it('validates "Dansk" localization across settings v2 navigation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const preferencesAndDisplaySettings =
          new PreferencesAndDisplaySettings(driver);
        await preferencesAndDisplaySettings.checkPageIsLoaded();

        await preferencesAndDisplaySettings.changeLanguage('Dansk');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageDansk,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await driver.refresh();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.openSearch();

        const isWaterTextChanged = await driver.isElementPresent(
          selectors.waterTextDansk,
        );
        assert.equal(
          isWaterTextChanged,
          true,
          'Water text in the search box does not match with the selected language',
        );

        const isHeaderTextChanged = await driver.isElementPresent(
          selectors.headerTextDansk,
        );
        assert.equal(
          isHeaderTextChanged,
          true,
          'Language change is not reflected in headers',
        );
      },
    );
  });

  it('validates "Deutsch" localization in error messages', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const preferencesAndDisplaySettings =
          new PreferencesAndDisplaySettings(driver);
        await preferencesAndDisplaySettings.checkPageIsLoaded();

        await preferencesAndDisplaySettings.changeLanguage('Deutsch');
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.currentLanguageDeutsch,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await new SettingsPage(driver).closeSettingsPage();

        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.startSendFlow();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken('0x539', 'ETH');
        await sendPage.fillRecipient('0xAAA');

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

  it('validates "मानक हिन्दी" localization in tooltips', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const preferencesAndDisplaySettings =
          new PreferencesAndDisplaySettings(driver);
        await preferencesAndDisplaySettings.checkPageIsLoaded();

        await preferencesAndDisplaySettings.changeLanguage('मानक हिन्दी');

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

  it('validates "العربية" localization in settings layout', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const preferencesAndDisplaySettings =
          new PreferencesAndDisplaySettings(driver);
        await preferencesAndDisplaySettings.checkPageIsLoaded();

        await preferencesAndDisplaySettings.changeLanguage('العربية');

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
