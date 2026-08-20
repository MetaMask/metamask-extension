import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';
import { E2E_SRP } from '../../../constants';

/**
 * Import-wallet Secret Recovery Phrase entry during onboarding.
 *
 * Screen: `#/onboarding/import-with-recovery-phrase`
 * Owns: SRP paste / word-by-word input, clear-all, checksum error, and
 * confirm (including the disabled-until-valid state).
 * Boundaries: import SRP entry only. Does not set the password or handle
 * create-wallet SRP reveal/confirm (that is `SecureWalletPage`).
 * Related: preceded by `StartOnboardingPage.importWallet` /
 * `clickImportWithSrpButton`; next is `OnboardingPasswordPage`; then
 * `SetupPasskeyPage` → `OnboardingMetricsPage` → `OnboardingCompletePage`;
 * `flows/onboarding.flow.ts`.
 *
 * @see ui/pages/onboarding-flow/import-srp/import-srp.tsx
 */
class OnboardingSrpPage {
  private readonly clearAllButton = {
    tag: 'span',
    text: 'Clear all',
  };

  private driver: Driver;

  private readonly importDescription = {
    tag: 'p',
    text: 'Enter your Secret Recovery Phrase',
  };

  private readonly page = '[data-testid="parent-selector-onboarding-srp"]';

  private readonly srpConfirmButton = '[data-testid="import-srp-confirm"]';

  private readonly srpError =
    '[data-testid="srp-input-import__invalid-checksum-error"]';

  private readonly srpIndividualWord = '[data-testid="import-srp__srp-word-0"]';

  private readonly srpMessage = {
    text: 'Import a wallet',
    tag: 'h2',
  };

  private readonly srpWord0 = '[data-testid="srp-input-import__srp-note"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkConfirmSrpButtonIsDisabled(): Promise<void> {
    console.log('Check that confirm SRP button is disabled');
    const confirmSeedPhrase = await this.driver.findElement(
      this.srpConfirmButton,
    );
    assert.equal(await confirmSeedPhrase.isEnabled(), false);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.page,
        this.srpMessage,
        this.srpWord0,
        this.importDescription,
      ]);
      // Continue button is initially disabled
      await this.driver.waitForSelector(this.srpConfirmButton, {
        state: 'disabled',
      });
    } catch (e) {
      console.log(
        'Timeout while waiting for onboarding srp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding srp page is loaded');
  }

  async checkSrpError(): Promise<void> {
    console.log('Check that SRP error is displayed');
    await this.driver.waitForSelector(this.srpError);
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.srpConfirmButton);
  }

  async clickConfirmButtonWithSrpError(): Promise<void> {
    await this.driver.clickElement(this.srpConfirmButton);
  }

  /**
   * Fill the SRP words with the provided seed phrase
   *
   * @param seedPhrase - The seed phrase to fill. Defaults to E2E_SRP.
   */
  async fillSrp(seedPhrase: string = E2E_SRP): Promise<void> {
    await this.driver.pasteIntoField(this.srpWord0, seedPhrase);
    await this.driver.waitForSelector(this.srpIndividualWord);
    await this.driver.waitForSelector(this.clearAllButton);
  }

  /**
   * Fill the SRP words with the provided seed phrase word by word
   *
   * @param seedPhrase - The seed phrase to fill. Defaults to E2E_SRP.
   */
  async fillSrpWordByWord(seedPhrase: string = E2E_SRP): Promise<void> {
    const words = seedPhrase.split(' ');
    for (const word of words) {
      const wordIndex = words.indexOf(word);
      if (wordIndex === 0) {
        await this.driver.waitForSelector(this.srpWord0);
        const srpWord0Input = await this.driver.findElement(this.srpWord0);
        await this.driver.fill(this.srpWord0, word);
        await srpWord0Input.sendKeys(this.driver.Key.SPACE);
      } else {
        const srpWordSelector = `[data-testid="import-srp__srp-word-${wordIndex}"]`;
        await this.driver.waitForSelector(srpWordSelector);
        const srpWordInput = await this.driver.findElement(srpWordSelector);
        await srpWordInput.sendKeys(word);
        if (wordIndex < words.length - 1) {
          await srpWordInput.sendKeys(this.driver.Key.SPACE);
        }
      }
    }
  }
}

export default OnboardingSrpPage;
