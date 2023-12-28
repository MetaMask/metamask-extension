const { strict: assert } = require('assert');
const { By } = require('selenium-webdriver');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  settingsOption: { text: 'Settings', tag: 'div' },
  localeSelect: '[data-testid="locale-select"]',
  appHeaderLogo: '[data-testid="app-header-logo"]',
  ethOverviewSend: '[data-testid="eth-overview-send"]',
  ensInput: '[data-testid="ens-input"]',
  nftsTab: '[data-testid="home__nfts-tab"]',
};

async function changeLanguage({ driver, languageIndex }) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsOption);

  const dropdownElement = await driver.findElement(selectors.localeSelect);
  await dropdownElement.click();

  const options = await dropdownElement.findElements(By.tagName('option'));
  await options[languageIndex].click();
}

describe('Settings - general validate the change language functionality', function () {
  it('User selects "Español" language and verify that changing the language from the default', async function () {
    const languageIndex = 10;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);

        await changeLanguage({ driver, languageIndex });
        // Validate the label changes
        const advanceText = await driver.findElement({
          tag: 'span',
          text: 'Idioma actual',
        });
        assert.equal(
          await advanceText.getText(),
          'Idioma Actual',
          'Language did not change',
        );
      },
    );
  });

  it('User selects "Español" language from the dropdown and change back to english and verify that the word is correctly changed back to english', async function () {
    let languageIndex = 10;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });
        const advanceText = await driver.findElement({
          tag: 'span',
          text: 'Idioma actual',
        });
        assert.equal(
          await advanceText.getText(),
          'Idioma Actual',
          'Language did not change',
        );

        await driver.delay(2000);

        languageIndex = 9;
        const dropdownElement = await driver.findElement(
          selectors.localeSelect,
        );
        await dropdownElement.click();
        console.log(' dropdownElement:', dropdownElement);
        const options = await dropdownElement.findElements(
          By.tagName('option'),
        );
        await options[languageIndex].click();

        await driver.delay(2000);

        const labelText = await driver.findElement(
          By.css('.settings-page__content-label'),
        );
        assert.equal(
          await labelText.getText(),
          'Current Language',
          'Language did not change',
        );
      },
    );
  });

  it('User selects "Español" and verify that language persists with page refresh and sessions', async function () {
    const languageIndex = 10;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });

        await driver.refresh();
        const advanceText = await driver.findElement({
          tag: 'span',
          text: 'Idioma actual',
        });
        assert.equal(
          await advanceText.getText(),
          'Idioma Actual',
          'Language did not change',
        );

        await driver.navigate();

        await driver.delay(2000);
        // Validating the tooltip
        assert.equal(
          await driver.isElementPresent(
            '[data-original-title="Copiar al Portapapeles"]',
          ),
          true,
          'Language changes is not reflected on the toolTip',
        );
      },
    );
  });

  it('User selects "Dansk" language and verify that navigating to a different page does not affect', async function () {
    const languageIndex = 6;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });

        await driver.clickElement({ text: 'Avanceret', tag: 'div' });

        // Confirm that the language change is reflected in search box water text
        assert.equal(
          await driver.isElementPresent('[placeholder="Søg"]'),
          true,
          'Water text in the search box does not match with the selected language',
        );

        // Confirm that the language change is reflected in headers

        assert.equal(
          await driver.isElementPresent({
            text: 'Indstillinger',
            tag: 'h3',
          }),
          true,
          'Language change is not reflected in headers',
        );

        // Confirm that the language change is reflected in button
        const buttonText = await driver.findElement(
          '[data-testid="auto-lockout-button"]',
        );

        assert.equal(
          await buttonText.getText(),
          'Gem',
          'Language change is not reflected in button',
        );
      },
    );
  });

  it('User selects "Deutsch" language and verify that error messages are updated with the selected language change', async function () {
    if (process.env.MULTICHAIN) {
      return;
    }

    const languageIndex = 7;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });
        await driver.clickElement(selectors.appHeaderLogo);
        await driver.clickElement(selectors.ethOverviewSend);
        await driver.fill(selectors.ensInput, 'test');
        // Validate the language change is reflected in the dialog message
        assert.equal(
          await driver.isElementPresent({
            text: 'Empfängeradresse ist unzulässig',
            tag: 'div',
          }),
          true,
          'Language change is not reflected in dialog message',
        );
      },
    );
  });

  it('User selects "मानक हिन्दी" language and verify that tooltips are updated with the selected language change', async function () {
    if (process.env.MULTICHAIN) {
      return;
    }

    const languageIndex = 19;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });
        await driver.clickElement(selectors.appHeaderLogo);
        // Validate the account tooltip
        assert.equal(
          await driver.isElementPresent(
            '[data-original-title="क्लिपबोर्ड पर कॉपी करें"]',
          ),
          true,
          'Language changes is not reflected on the account toolTip',
        );
        // Validate the bridge tooltip
        assert.equal(
          await driver.isElementPresent(
            '[data-original-title="इस नेटवर्क पर उपलब्ध नहीं है"]',
          ),
          true,
          'Language changes is not reflected on the bridge toolTip',
        );
      },
    );
  });

  it('User selects "Magyar" language and verify that hypertext are updated with the selected language change', async function () {
    const languageIndex = 23;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });
        await driver.clickElement(selectors.appHeaderLogo);
        await driver.clickElement(selectors.nftsTab);
        // Validate the hypertext
        assert.equal(
          await driver.isElementPresent({
            text: 'Tudjon meg többet',
            tag: 'a',
          }),
          true,
          'Language change is not reflected on hypertext',
        );
      },
    );
  });

  it('User selects "العربية" language and verify that page indent with the selected language change', async function () {
    const languageIndex = 1;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await changeLanguage({ driver, languageIndex });
        // Validate the header text
        assert.equal(
          await driver.isElementPresent({
            text: 'الإعدادات',
            tag: 'h3',
          }),
          true,
          'Language change is not reflected in headers',
        );
      },
    );
  });
});
