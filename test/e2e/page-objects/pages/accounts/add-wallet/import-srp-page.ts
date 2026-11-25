import { Driver } from '../../../../webdriver/driver';

/**
 * Import a wallet with a Secret Recovery Phrase, after onboarding.
 *
 * Screen: `#/import-srp`, reached from `ChooseWalletTypePage.clickImportWallet`.
 * Owns: the SRP input, its value checks and the continue button.
 * Boundaries: the import form only. On success the app returns home with a
 * "wallet imported" toast, which belongs to `HomePage`. Onboarding SRP import
 * belongs to `OnboardingSrpPage`.
 * Related: `ChooseWalletTypePage`, `HomePage`.
 *
 * @see ui/pages/multi-srp/import-srp/import-srp.tsx
 * @see ui/components/app/srp-input-import/srp-input-import.tsx
 */
class ImportSrpPage {
  private readonly continueButton = '[data-testid="import-srp-confirm"]';

  private readonly driver: Driver;

  private readonly importSrpPage = '.import-srp__multi-srp';

  private readonly srpInput = '[data-testid="srp-input-import__srp-note"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks that the page is loaded. The SRP is entered through a single
   * field, rather than one input per word.
   */
  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.importSrpPage,
        this.srpInput,
        this.continueButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for import SRP page to be loaded', e);
      throw e;
    }
    console.log('Import SRP page is loaded');
  }

  /**
   * Wait until the SRP input displays the expected value. A textarea holds its
   * value as a property rather than an attribute, so this polls the value
   * instead of matching it with a locator.
   *
   * @param expectedValue - The expected value.
   */
  async checkSrpInputValue(expectedValue: string): Promise<void> {
    console.log(`Check that the import SRP input value is "${expectedValue}"`);
    let actualValue: string | null = null;
    try {
      await this.driver.waitUntil(
        async () => {
          const srpInput = await this.driver.findElement(this.srpInput);
          actualValue = await srpInput.getAttribute('value');
          return actualValue === expectedValue;
        },
        { interval: 100, timeout: this.driver.timeout },
      );
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Import SRP input value should match the typed word. Expected "${expectedValue}", got "${actualValue}". ${reason}`,
      );
    }
  }

  /**
   * Paste the SRP into the input and continue.
   *
   * @param srp - Space-separated recovery phrase words.
   */
  async importSrp(srp: string): Promise<void> {
    console.log(`Importing ${srp.split(' ').length} word srp`);
    await this.driver.pasteIntoField(this.srpInput, srp);
    await this.driver.clickElement(this.continueButton);
  }

  /**
   * Type into the SRP input.
   *
   * @param text - The text to type.
   */
  async typeIntoSrpInput(text: string): Promise<void> {
    console.log(`Type "${text}" into the import SRP input`);
    const srpInput = await this.driver.findVisibleElement(this.srpInput);
    await srpInput.sendKeys(text);
  }
}

export default ImportSrpPage;
