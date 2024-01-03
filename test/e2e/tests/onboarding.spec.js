const { strict: assert } = require('assert');
const { By } = require('selenium-webdriver');
const {
  TEST_SEED_PHRASE,
  convertToHexValue,
  withFixtures,
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
  importWrongSRPOnboardingFlow,
  testSRPDropdownIterations,
  locateAccountBalanceDOM,
  defaultGanacheOptions,
  WALLET_PASSWORD,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('MetaMask onboarding @no-mmi', function () {
  const wrongSeedPhrase =
    'test test test test test test test test test test test test';
  const wrongTestPassword = 'test test test test';

  const ganacheOptions2 = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(10000000000000000000),
      },
    ],
  };

  it('Clicks create a new wallet, accepts a secure password, reveals the Secret Recovery Phrase, confirm SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeCreateNewWalletOnboardingFlow(driver, WALLET_PASSWORD);

        const homePage = await driver.findElement('.home__main-view');
        const homePageDisplayed = await homePage.isDisplayed();

        assert.equal(homePageDisplayed, true);
      },
    );
  });

  it('Clicks import a new wallet, accepts a secure password, reveals the Secret Recovery Phrase, confirm SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeImportSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );

        const homePage = await driver.findElement('.home__main-view');
        const homePageDisplayed = await homePage.isDisplayed();

        assert.equal(homePageDisplayed, true);
      },
    );
  });

  it('User import wrong Secret Recovery Phrase', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await importWrongSRPOnboardingFlow(driver, wrongSeedPhrase);

        const confirmSeedPhrase = await driver.findElement(
          '[data-testid="import-srp-confirm"]',
        );

        assert.equal(await confirmSeedPhrase.isEnabled(), false);
      },
    );
  });

  it('Check if user select different type of secret recovery phrase', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        // accept terms of use
        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');

        // welcome
        await driver.clickElement('[data-testid="onboarding-import-wallet"]');

        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        const dropdowns = await driver.findElements('select');
        const dropdownElement = dropdowns[1];
        await dropdownElement.click();
        const options = await dropdownElement.findElements(
          By.tagName('option'),
        );

        const iterations = options.length;

        await testSRPDropdownIterations(options, driver, iterations);

        const finalFormFields = await driver.findElements(
          '.import-srp__srp-word-label',
        );
        const expectedFinalNumFields = 24; // The last iteration will have 24 fields
        const actualFinalNumFields = finalFormFields.length;
        assert.equal(actualFinalNumFields, expectedFinalNumFields);
      },
    );
  });

  it('User enters the wrong password during password creation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');
        await driver.clickElement('[data-testid="onboarding-create-wallet"]');

        // metrics
        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        // Fill in confirm password field with incorrect password
        await driver.fill(
          '[data-testid="create-password-new"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-password-confirm"]',
          wrongTestPassword,
        );

        // Check that the error message is displayed for the password fields
        await driver.isElementPresent(
          { text: "Passwords don't match", tag: 'h6' },
          true,
        );

        // Check that the "Confirm Password" button is disabled
        const confirmPasswordButton = await driver.findElement(
          '[data-testid="create-password-wallet"]',
        );
        assert.equal(await confirmPasswordButton.isEnabled(), false);
      },
    );
  });

  it('Verify that the user has been redirected to the correct page after importing their wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await importSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );
        // Verify site
        assert.equal(
          await driver.isElementPresent({
            text: 'Wallet creation successful',
            tag: 'h2',
          }),
          true,
        );
      },
    );
  });

  it('Verify that the user has been redirected to the correct page after creating a password for their new wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');
        await driver.clickElement('[data-testid="onboarding-create-wallet"]');

        // metrics
        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        // Fill in confirm password field with correct password
        await driver.fill(
          '[data-testid="create-password-new"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-password-confirm"]',
          WALLET_PASSWORD,
        );
        await driver.clickElement('[data-testid="create-password-terms"]');
        await driver.clickElement('[data-testid="create-password-wallet"]');

        // Verify site
        assert.equal(
          await driver.isElementPresent({
            text: 'Secure your wallet',
            tag: 'h2',
          }),
          true,
        );
      },
    );
  });

  it('User can add custom network during onboarding', async function () {
    const networkName = 'Localhost 8546';
    const networkUrl = 'http://127.0.0.1:8546';
    const currencySymbol = 'ETH';
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: { port, chainId, ganacheOptions2 },
        },
        title: this.test.fullTitle(),
      },

      async ({ driver, secondaryGanacheServer }) => {
        await driver.navigate();
        await importSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );

        // Add custome network localhost 8546 during onboarding
        await driver.clickElement({ text: 'Advanced configuration', tag: 'a' });
        await driver.clickElement('.mm-picker-network');
        await driver.clickElement({
          text: 'Add network',
          tag: 'button',
        });

        const [
          networkNameField,
          networkUrlField,
          chainIdField,
          currencySymbolField,
        ] = await driver.findElements('input[type="text"]');
        await networkNameField.sendKeys(networkName);
        await networkUrlField.sendKeys(networkUrl);
        await chainIdField.sendKeys(chainId.toString());
        await currencySymbolField.sendKeys(currencySymbol);

        await driver.clickElement({ text: 'Save', tag: 'button' });
        await driver.waitForElementNotPresent('span .modal');
        await driver.clickElement({ text: 'Done', tag: 'button' });

        // After login, check that notification message for added network is displayed
        const notificationMessage = `“${networkName}” was successfully added!`;
        const networkNotification = await driver.isElementPresent({
          css: '[class*="actionable-message__message"]',
          text: notificationMessage,
        });
        assert.equal(networkNotification, true);
        await driver.clickElement({ text: 'Dismiss', tag: 'h6' });

        // Check localhost 8546 is selected and its balance value is correct
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: networkName,
        });

        await locateAccountBalanceDOM(driver, secondaryGanacheServer);
      },
    );
  });
});
