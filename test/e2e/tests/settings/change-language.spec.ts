const { strict: assert } = require('assert');
import { Suite } from 'mocha';
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
import { Driver } from '../../webdriver/driver';

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  settingsOption: { text: 'Settings', tag: 'div' },
  localeSelect: '[data-testid="locale-select"]',
  ethOverviewSend: '[data-testid="eth-overview-send"]',
  ensInput: '[data-testid="ens-input"]',
  nftsTab: '[data-testid="home__nfts-tab"]',
  labelSpanish: { tag: 'span', text: 'Idioma actual' },
  currentLanguageLabel: { tag: 'span', text: 'Current language' },
  advanceText: { text: 'Avanceret', tag: 'div' },
  waterText: '[placeholder="Søg"]',
  headerTextDansk: { text: 'Indstillinger', tag: 'h3' },
  buttonText: { css: '[data-testid="auto-lockout-button"]', text: 'Gem' },
  dialogText: { text: 'Empfängeradresse ist unzulässig', tag: 'div' },
  accountTooltipText: '[data-original-title="क्लिपबोर्ड पर कॉपी करें"]',
  bridgeTooltipText: '[data-original-title="इस नेटवर्क पर उपलब्ध नहीं है"]',
  hyperText: { text: 'Tudjon meg többet', tag: 'a' },
  headerText: { text: 'الإعدادات', tag: 'h3' },
};

async function changeLanguage(driver: Driver , languageIndex: number) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);

  const dropdownElement = await driver.findElement(selectors.localeSelect);
  await dropdownElement.click();

  const options = await dropdownElement.findElements({ css: 'option' });
  await options[languageIndex].click();
}

describe('Settings - general tab @no-mmi', function (this: Suite) {
  it('validate the change language functionality', async function () {
    let languageIndex = 10;

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await changeLanguage(driver, languageIndex);

        // Validate the label changes to Spanish
        const isLanguageLabelChanged = await driver.isElementPresent(
          selectors.labelSpanish,
        );
        assert.equal(isLanguageLabelChanged, true, 'Language did not change');

        await driver.refresh();

        // Change back to English and verify that the word is correctly changed back to English
        languageIndex = 9;

        const dropdownElement = await driver.findElement(
          selectors.localeSelect,
        );
        await dropdownElement.click();
        const options = await dropdownElement.findElements({ css: 'option' });
        await options[languageIndex].click();

        const isLabelTextChanged = await driver.isElementPresent(
          selectors.currentLanguageLabel,
        );
        assert.equal(isLabelTextChanged, true, 'Language did not change');
      },
    );
  });

  it('validate "Dansk" language on page navigation', async function () {
    const languageIndex = 6;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await changeLanguage(driver, languageIndex );

        await driver.assertElementNotPresent('.loading-overlay__spinner');

        await driver.clickElement(selectors.advanceText);

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
    if (process.env.MULTICHAIN) {
      return;
    }

    const languageIndex = 7;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await changeLanguage( driver, languageIndex );
        await driver.navigate();
        await driver.clickElement(selectors.ethOverviewSend);
        await driver.fill(selectors.ensInput, 'test');

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
    if (process.env.MULTICHAIN) {
      return;
    }

    const languageIndex = 19;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await changeLanguage( driver, languageIndex );
        await driver.navigate();

        // Validate the account tooltip
        const isAccountTooltipChanged = await driver.isElementPresent(
          selectors.accountTooltipText,
        );
        assert.equal(
          isAccountTooltipChanged,
          true,
          'Language changes is not reflected on the account toolTip',
        );

        // Validate the bridge tooltip
        const isBridgeTooltipChanged = await driver.isElementPresent(
          selectors.bridgeTooltipText,
        );
        assert.equal(
          isBridgeTooltipChanged,
          true,
          'Language changes is not reflected on the bridge toolTip',
        );
      },
    );
  });

  it('validate "Magyar" language change on hypertext', async function () {
    const languageIndex = 23;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },

      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        // selects "Magyar" language
        await changeLanguage( driver, languageIndex );
        await driver.navigate();
        await driver.clickElement(selectors.nftsTab);

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
    const languageIndex = 1;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await changeLanguage( driver, languageIndex );

        // Validate the header text
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
