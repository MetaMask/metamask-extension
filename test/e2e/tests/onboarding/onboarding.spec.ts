import { strict as assert } from 'assert';
import { By, WebElement } from 'selenium-webdriver';
import {
  TEST_SEED_PHRASE,
  withFixtures,
  defaultGanacheOptions,
  WALLET_PASSWORD,
  Fixtures,
  largeDelayMs,
  tinyDelayMs,
  locateAccountBalanceDOM,
  importSRPOnboardingFlow,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';

// Implementation of toHex function
const toHex = (num: number): string => `0x${num.toString(16)}`;

class OnboardingPage {
  constructor(private driver: Driver) {}

  async acceptTermsOfUse(): Promise<void> {
    const agreeButton = await this.driver.findElement(
      By.xpath(`//button[text()='I agree']`)
    );
    await (await agreeButton).click();
  }

  async clickCreateWallet(): Promise<void> {
    const createWalletButton = await this.driver.findElement(
      By.xpath(`//button[text()='Create a new wallet']`)
    );
    await (await createWalletButton).click();
  }

  async clickImportWallet(): Promise<void> {
    const importWalletButton = await this.driver.findElement(
      By.xpath(`//button[text()='Import an existing wallet']`)
    );
    await (await importWalletButton).click();
  }

  async chooseMetametricsOption(option: 'agree' | 'no-thanks'): Promise<void> {
    const buttonText = option === 'agree' ? 'I agree' : 'No thanks';
    const metametricsButton = await this.driver.findElement(
      By.xpath(`//button[text()='${buttonText}']`)
    );
    await (await metametricsButton).click();
  }

  async importWallet(seedPhrase: string, password: string): Promise<void> {
    await this.acceptTermsOfUse();
    await this.clickImportWallet();
    await this.chooseMetametricsOption('no-thanks');
    const importSRPPage = new ImportSRPPage(this.driver);
    await importSRPPage.fillSRP(seedPhrase);
    await importSRPPage.confirmSRP();
    const createPasswordPage = new CreatePasswordPage(this.driver);
    await createPasswordPage.fillPassword(password);
    await createPasswordPage.acceptTerms();
    await createPasswordPage.submitForm();
  }
}

class CreatePasswordPage {
  constructor(private driver: Driver) {}

  async fillPassword(password: string): Promise<void> {
    const newPasswordField = await this.driver.findElement(
      By.css('[data-testid="create-password-new"]')
    );
    await (await newPasswordField).sendKeys(password);
    const confirmPasswordField = await this.driver.findElement(
      By.css('[data-testid="create-password-confirm"]')
    );
    await (await confirmPasswordField).sendKeys(password);
  }

  async acceptTerms(): Promise<void> {
    const termsCheckbox = await this.driver.findElement(
      By.css('[data-testid="create-password-terms"]')
    );
    await (await termsCheckbox).click();
  }

  async submitForm(): Promise<void> {
    const submitButton = await this.driver.findElement(
      By.css('[data-testid="create-password-wallet"]')
    );
    await (await submitButton).click();
  }

  async isConfirmButtonEnabled(): Promise<boolean> {
    const confirmButton = await this.driver.findElement(
      By.css('[data-testid="create-password-wallet"]')
    );
    return await confirmButton.isEnabled();
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = await this.driver.findElement(
      By.css('.create-password__error')
    );
    return await errorElement.getText();
  }
}

class SecureWalletPage {
  constructor(private driver: Driver) {}

  async clickSecureSRP(): Promise<void> {
    const secureButton = await this.driver.findElement(
      By.xpath(`//button[text()='Secure my wallet']`)
    );
    await (await secureButton).click();
  }

  async revealSRP(): Promise<void> {
    const revealButton = await this.driver.findElement(
      By.xpath(`//button[text()='Reveal Secret Recovery Phrase']`)
    );
    await (await revealButton).click();
  }

  async confirmSRP(): Promise<void> {
    const nextButton = await this.driver.findElement(
      By.xpath(`//button[text()='Next']`)
    );
    await (await nextButton).click();
    // Implement the logic to confirm SRP here
  }
}

class ImportSRPPage {
  constructor(private driver: Driver) {}

  async fillSRP(seedPhrase: string): Promise<void> {
    const words = seedPhrase.split(' ');
    for (let i = 0; i < words.length; i++) {
      const wordInput = await this.driver.findElement(
        By.css(`[data-testid="import-srp__srp-word-${i}"]`)
      );
      await (await wordInput).sendKeys(words[i]);
    }
  }

  async confirmSRP(): Promise<void> {
    const confirmButton = await this.driver.findElement(
      By.xpath(`//button[text()='Confirm Secret Recovery Phrase']`)
    );
    await (await confirmButton).click();
  }

  async selectSRPWordCount(count: number): Promise<void> {
    const dropdown = await this.driver.findElement(
      By.css('.import-srp__number-of-words-dropdown')
    );
    await (await dropdown).click();
    const option = await this.driver.findElement(
      By.xpath(`//option[text()='${count}']`)
    );
    await (await option).click();
  }

  async getSRPFieldCount(): Promise<number> {
    const fields = await this.driver.findElements(
      By.css('.import-srp__srp-word-label')
    );
    return fields.length;
  }

  async getSRPDropdownOptions(): Promise<WebElement[]> {
    const dropdownElement = await this.driver.findElement(
      By.css('.import-srp__number-of-words-dropdown')
    );
    await (await dropdownElement).click();
    return await dropdownElement.findElements(By.css('option'));
  }

  async isConfirmSRPButtonEnabled(): Promise<boolean> {
    const confirmButton = await this.driver.findElement(
      By.css('[data-testid="import-srp-confirm"]')
    );
    return await confirmButton.isEnabled();
  }

  async toggleSRPVisibility(): Promise<void> {
    const toggleButton = await this.driver.findElement(
      By.css('.import-srp__show-srp-button')
    );
    await (await toggleButton).click();
  }

  async isSRPVisible(): Promise<boolean> {
    const srpElement = await this.driver.findElement(
      By.css('.import-srp__srp-text')
    );
    return await srpElement.isDisplayed();
  }
}

class SettingsPage {
  constructor(private driver: Driver) {}

  async addCustomNetwork(): Promise<void> {
    await this.driver.clickElement({
      text: 'Manage default privacy settings',
      tag: 'button',
    });
    await this.driver.clickElement({
      text: 'General',
    });
    await this.driver.delay(largeDelayMs);
    await this.driver.clickElement({ text: 'Add a network' });
  }

  async completeOnboarding(): Promise<void> {
    await this.driver.clickElement('[data-testid="category-back-button"]');
    await this.driver.waitForElementToStopMoving(
      '[data-testid="privacy-settings-back-button"]'
    );
    await this.driver.clickElement(
      '[data-testid="privacy-settings-back-button"]'
    );
    await this.driver.clickElementAndWaitToDisappear({
      text: 'Done',
      tag: 'button',
    });
    await this.driver.clickElement({
      text: 'Next',
      tag: 'button',
    });
    await this.driver.waitForElementToStopMoving({
      text: 'Done',
      tag: 'button',
    });
    await this.driver.clickElementAndWaitToDisappear({
      text: 'Done',
      tag: 'button',
    });
  }
}

class NetworkPage {
  constructor(private driver: Driver) {}

  async addNetwork(networkName: string, networkUrl: string, chainId: string, currencySymbol: string): Promise<void> {
    await this.driver.waitForSelector(
      '.multichain-network-list-menu-content-wrapper__dialog'
    );
    await this.driver.fill(
      '[data-testid="network-form-network-name"]',
      networkName
    );
    await this.driver.fill(
      '[data-testid="network-form-chain-id"]',
      chainId
    );
    await this.driver.fill(
      '[data-testid="network-form-ticker-input"]',
      currencySymbol
    );
    const rpcUrlInputDropDown = await this.driver.waitForSelector(
      '[data-testid="test-add-rpc-drop-down"]'
    );
    await this.driver.delay(tinyDelayMs);
    await rpcUrlInputDropDown.click();
    await this.driver.delay(tinyDelayMs);
    await this.driver.clickElement({
      text: 'Add RPC URL',
      tag: 'button',
    });
    const rpcUrlInput = await this.driver.waitForSelector(
      '[data-testid="rpc-url-input-test"]'
    );
    await rpcUrlInput.clear();
    await rpcUrlInput.sendKeys(networkUrl);
    await this.driver.clickElement({
      text: 'Add URL',
      tag: 'button',
    });
    await this.driver.clickElementAndWaitToDisappear({
      tag: 'button',
      text: 'Save',
    });
  }
}

describe('MetaMask onboarding @no-mmi', function () {
  const wrongSeedPhrase =
    'test test test test test test test test test test test test';
  const wrongTestPassword = 'test test test test';

  it('User can add custom network during onboarding', async function () {
    const networkName: string = 'Localhost 8546';
    const networkUrl: string = 'http://127.0.0.1:8546';
    const currencySymbol: string = 'ETH';
    const port: number = 8546;
    const chainId: number = 1338;
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port, chainId }],
        },
        title: this.test?.fullTitle()!,
      },
      async (fixtures: Fixtures) => {
        const { driver, secondaryGanacheServer } = fixtures;
        try {
          await driver.navigate();
          await importSRPOnboardingFlow(
            driver,
            TEST_SEED_PHRASE,
            WALLET_PASSWORD,
          );

          await driver.clickElement({
            text: 'Manage default privacy settings',
            tag: 'button',
          });

          await driver.clickElement({
            text: 'General',
          });
          await driver.delay(largeDelayMs);
          await driver.clickElement({ text: 'Add a network' });

          await driver.waitForSelector(
            '.multichain-network-list-menu-content-wrapper__dialog',
          );

          await driver.fill(
            '[data-testid="network-form-network-name"]',
            networkName,
          );
          await driver.fill(
            '[data-testid="network-form-chain-id"]',
            chainId.toString(),
          );
          await driver.fill(
            '[data-testid="network-form-ticker-input"]',
            currencySymbol,
          );

          // Add rpc url
          const rpcUrlInputDropDown = (await driver.waitForSelector(
            '[data-testid="test-add-rpc-drop-down"]',
          )) as WebElement;
          await driver.delay(tinyDelayMs);
          await rpcUrlInputDropDown.click();
          await driver.delay(tinyDelayMs);
          await driver.clickElement({
            text: 'Add RPC URL',
            tag: 'button',
          });
          const rpcUrlInput = (await driver.waitForSelector(
            '[data-testid="rpc-url-input-test"]',
          )) as WebElement;
          await rpcUrlInput.clear();
          await rpcUrlInput.sendKeys(networkUrl);
          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });

          await driver.clickElementAndWaitToDisappear({
            tag: 'button',
            text: 'Save',
          });

          await driver.clickElement('[data-testid="category-back-button"]');

          // Wait until the onboarding carousel has stopped moving
          // otherwise the click has no effect.
          await driver.waitForElementToStopMoving(
            '[data-testid="privacy-settings-back-button"]',
          );

          await driver.clickElement(
            '[data-testid="privacy-settings-back-button"]',
          );

          await driver.clickElementAndWaitToDisappear({
            text: 'Done',
            tag: 'button',
          });

          await driver.clickElement({
            text: 'Next',
            tag: 'button',
          });

          // Wait until the onboarding carousel has stopped moving
          // otherwise the click has no effect.
          await driver.waitForElementToStopMoving({
            text: 'Done',
            tag: 'button',
          });

          await driver.clickElementAndWaitToDisappear({
            text: 'Done',
            tag: 'button',
          });

          await driver.clickElement('.mm-picker-network');
          await driver.clickElement(
            `[data-rbd-draggable-id="${toHex(chainId)}"]`,
          );
          await driver.delay(largeDelayMs);
          // Check localhost 8546 is selected and its balance value is correct
          const networkDisplay = await driver.findElement({
            css: '[data-testid="network-display"]',
            text: networkName,
          });
          assert.ok(networkDisplay, 'Custom network should be selected and displayed');

          await locateAccountBalanceDOM(driver, secondaryGanacheServer[0]);
        } catch (error) {
          console.error('Error in test:', error);
          throw error;
        }
      },
    );
  });

  it('Creates a new wallet, sets up a secure password, and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async (fixtures: Fixtures) => {
        const { driver } = fixtures;
        try {
          const onboardingPage = new OnboardingPage(driver);
          const createPasswordPage = new CreatePasswordPage(driver);
          const secureWalletPage = new SecureWalletPage(driver);

          // Step 1: Navigate to the onboarding page
          await driver.navigate();

          // Step 2: Accept terms of use
          await onboardingPage.acceptTermsOfUse();

          // Step 3: Choose to create a new wallet
          await onboardingPage.clickCreateWallet();

          // Step 4: Opt out of Metametrics
          await onboardingPage.chooseMetametricsOption('no-thanks');

          // Step 5: Set up a secure password
          await createPasswordPage.fillPassword(WALLET_PASSWORD);
          await createPasswordPage.acceptTerms();
          await createPasswordPage.submitForm();

          // Step 6: Secure the wallet
          await secureWalletPage.clickSecureSRP();
          await secureWalletPage.revealSRP();
          await secureWalletPage.confirmSRP();

          // Step 7: Verify that the home page is displayed
          const homePage = await driver.findElement(By.css('.home__main-view'));
          const homePageDisplayed = await homePage.isDisplayed();
          assert.strictEqual(
            homePageDisplayed,
            true,
            'Home page should be displayed after completing onboarding',
          );
        } catch (error) {
          console.error('Error during wallet creation test:', error);
          throw error;
        }
      },
    );
  });

  it('Imports an existing wallet, sets up a secure password, and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async (fixtures: Fixtures) => {
        const { driver } = fixtures;
        try {
          const onboardingPage = new OnboardingPage(driver);
          const createPasswordPage = new CreatePasswordPage(driver);
          const importSRPPage = new ImportSRPPage(driver);

          // Step 1: Navigate to the onboarding page
          await driver.navigate();

          // Step 2: Accept terms of use
          await onboardingPage.acceptTermsOfUse();

          // Step 3: Choose to import an existing wallet
          await onboardingPage.clickImportWallet();

          // Step 4: Opt out of Metametrics
          await onboardingPage.chooseMetametricsOption('no-thanks');

          // Step 5: Enter and confirm the Secret Recovery Phrase
          await importSRPPage.fillSRP(TEST_SEED_PHRASE);
          await importSRPPage.confirmSRP();

          // Step 6: Set up a secure password
          await createPasswordPage.fillPassword(WALLET_PASSWORD);
          await createPasswordPage.acceptTerms();
          await createPasswordPage.submitForm();

          // Step 7: Verify that the home page is displayed
          const homePage = await driver.findElement(By.css('.home__main-view'));
          const homePageDisplayed = await homePage.isDisplayed();
          assert.strictEqual(
            homePageDisplayed,
            true,
            'Home page should be displayed after completing wallet import',
          );
        } catch (error) {
          console.error('Error during wallet import test:', error);
          throw error;
        }
      },
    );
  });

  it('Attempts to import a wallet with an incorrect Secret Recovery Phrase and verifies the error', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async (fixtures: Fixtures) => {
        const { driver } = fixtures;
        try {
          const onboardingPage = new OnboardingPage(driver);
          const importSRPPage = new ImportSRPPage(driver);

          // Step 1: Navigate to the onboarding page
          await driver.navigate();

          // Step 2: Accept terms of use
          await onboardingPage.acceptTermsOfUse();

          // Step 3: Choose to import an existing wallet
          await onboardingPage.clickImportWallet();

          // Step 4: Enter an incorrect Secret Recovery Phrase
          await importSRPPage.fillSRP(wrongSeedPhrase);

          // Step 5: Verify that the Confirm button is disabled
          const confirmSRPButtonEnabled =
            await importSRPPage.isConfirmSRPButtonEnabled();
          assert.strictEqual(
            confirmSRPButtonEnabled,
            false,
            'Confirm button should be disabled for incorrect SRP',
          );

          // TODO: Add additional assertions to verify error messages or UI indicators of an invalid SRP
        } catch (error) {
          console.error('Error during incorrect SRP import test:', error);
          throw error;
        }
      },
    );
  });

  it('Verifies the functionality of selecting different Secret Recovery Phrase word counts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async (fixtures: Fixtures) => {
        const { driver } = fixtures;
        try {
          const onboardingPage = new OnboardingPage(driver);
          const importSRPPage = new ImportSRPPage(driver);

          // Step 1: Navigate to the onboarding page
          await driver.navigate();

          // Step 2: Accept terms of use
          await onboardingPage.acceptTermsOfUse();

          // Step 3: Choose to import an existing wallet
          await onboardingPage.clickImportWallet();

          // Step 4: Opt out of Metametrics
          await onboardingPage.chooseMetametricsOption('no-thanks');

          // Step 5: Get SRP dropdown options
          const options = await importSRPPage.getSRPDropdownOptions();
          const iterations = options.length;

          // Step 6: Iterate through each SRP word count option
          for (let i = 0; i < iterations; i++) {
            const wordCount = Number(await options[i].getText());
            await importSRPPage.selectSRPWordCount(wordCount);
            const fieldCount = await importSRPPage.getSRPFieldCount();
            assert.strictEqual(
              fieldCount,
              wordCount,
              `Field count should match selected word count of ${wordCount}`,
            );
          }

          // Step 7: Verify the final form field count
          const finalFormFields = await importSRPPage.getSRPFieldCount();
          const expectedFinalNumFields = 24; // The last iteration should have 24 fields
          assert.strictEqual(
            finalFormFields,
            expectedFinalNumFields,
            'Final form should have 24 SRP fields',
          );

          // TODO: Add additional checks for UI updates or error handling when switching between word counts
        } catch (error) {
          console.error('Error during SRP word count selection test:', error);
          throw error;
        }
      },
    );
  });

  it('Verifies error handling when entering an incorrect password during wallet creation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async (fixtures: Fixtures) => {
        const { driver } = fixtures;
        try {
          const onboardingPage = new OnboardingPage(driver);
          const createPasswordPage = new CreatePasswordPage(driver);

          // Step 1: Navigate to the onboarding page
          await driver.navigate();

          // Step 2: Accept terms of use
          await onboardingPage.acceptTermsOfUse();

          // Step 3: Choose to create a new wallet
          await onboardingPage.clickCreateWallet();

          // Step 4: Opt out of Metametrics
          await onboardingPage.chooseMetametricsOption('no-thanks');

          // Step 5: Enter an incorrect password
          await createPasswordPage.fillPassword(wrongTestPassword);

          // Step 6: Accept terms
          await createPasswordPage.acceptTerms();

          // Step 7: Verify that the confirm button is disabled
          const confirmButtonEnabled =
            await createPasswordPage.isConfirmButtonEnabled();
          assert.strictEqual(
            confirmButtonEnabled,
            false,
            'Confirm button should be disabled for incorrect password',
          );

          // Step 8: Verify the error message
          const errorMessage = await createPasswordPage.getErrorMessage();
          assert.strictEqual(
            errorMessage,
            "Password doesn't match",
            'Correct error message should be displayed',
          );

          // TODO: Add additional checks for password strength indicators or other UI feedback
        } catch (error) {
          console.error('Error during incorrect password test:', error);
          throw error;
        }
      },
    );
  });

  it('Verifies the functionality of toggling SRP visibility during wallet import', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async (fixtures: Fixtures) => {
        const { driver } = fixtures;
        try {
          const onboardingPage = new OnboardingPage(driver);
          const importSRPPage = new ImportSRPPage(driver);

          // Step 1: Navigate to the onboarding page
          await driver.navigate();

          // Step 2: Accept terms of use
          await onboardingPage.acceptTermsOfUse();

          // Step 3: Choose to import an existing wallet
          await onboardingPage.clickImportWallet();

          // Step 4: Toggle SRP visibility on
          await importSRPPage.toggleSRPVisibility();
          const isSRPVisible = await importSRPPage.isSRPVisible();
          assert.strictEqual(
            isSRPVisible,
            true,
            'SRP should be visible after toggling on',
          );

          // Step 5: Toggle SRP visibility off
          await importSRPPage.toggleSRPVisibility();
          const isSRPHidden = await importSRPPage.isSRPVisible();
          assert.strictEqual(
            isSRPHidden,
            false,
            'SRP should be hidden after toggling off',
          );

          // TODO: Add additional checks for UI updates when toggling SRP visibility
        } catch (error) {
          console.error('Error during SRP visibility toggle test:', error);
          throw error;
        }
      },
    );
  });
});
