import { Driver } from '../../../../webdriver/driver';
import { largeDelayMs } from '../../../../helpers';

/**
 * Import an account with a private key or a JSON file.
 *
 * Screen: `#/add-wallet-page`, reached from
 * `ChooseWalletTypePage.clickImportAccount`.
 * Owns: the import type toggle, the private key input, the JSON file and
 * password inputs, the import button and import error messages.
 * Boundaries: the import form only. On success the app returns home with the
 * imported account selected, which belongs to `HomePage`.
 * Related: `ChooseWalletTypePage`, `HomePage`.
 *
 * @see ui/pages/multichain-accounts/add-wallet-page/add-wallet-page.tsx
 * @see ui/components/multichain/import-account/import-account.js
 */
class ImportAccountPage {
  private readonly backButton = '[data-testid="add-wallet-page-back-button"]';

  private readonly driver: Driver;

  private readonly errorMessage = (message: string) => ({
    text: message,
  });

  private readonly importButton =
    '[data-testid="import-account-confirm-button"]';

  private readonly importTypeToggle =
    '[data-testid="import-account-type-toggle"]';

  private readonly jsonFileInput = 'input[data-testid="file-input"]';

  private readonly jsonPasswordInput = 'input[id="json-password-box"]';

  private readonly jsonTypeButton = '[data-testid="import-account-type-json"]';

  private readonly privateKeyInput = '#private-key-box';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.backButton,
        this.importTypeToggle,
        this.importButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for import account page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Import account page is loaded');
  }

  /**
   * Import an account with a JSON file.
   *
   * @param jsonFilePath - Path to the JSON file to import.
   * @param password - Password for the imported account.
   */
  async importJsonFile(jsonFilePath: string, password: string): Promise<void> {
    console.log('Import account with JSON file');
    await this.driver.clickElement(this.jsonTypeButton);
    const fileInput = await this.driver.findElement(this.jsonFileInput);
    await fileInput.sendKeys(jsonFilePath);
    await this.driver.fill(this.jsonPasswordInput, password);
    // needed to mitigate a race condition with the state update
    // there is no condition we can wait for in the UI
    await this.driver.delay(largeDelayMs);
    await this.driver.clickElementAndWaitToDisappear(this.importButton);
  }

  /**
   * Import an account with a private key.
   *
   * @param privateKey - Private key of the account.
   * @param expectedErrorMessage - Expected error message if the import should
   * fail. The page stays open when the import fails.
   */
  async importPrivateKey(
    privateKey: string,
    expectedErrorMessage?: string,
  ): Promise<void> {
    console.log('Import account with private key');
    await this.driver.fill(this.privateKeyInput, privateKey);
    if (expectedErrorMessage) {
      await this.driver.clickElement(this.importButton);
      await this.driver.waitForSelector(
        this.errorMessage(expectedErrorMessage),
      );
    } else {
      // Import + forceUpdateMetamaskState can outlive the default 3s staleness
      // wait under multi-SRP / Solana load on CI before the page navigates
      // home.
      await this.driver.clickElementAndWaitToDisappear(
        this.importButton,
        30000,
      );
    }
  }
}

export default ImportAccountPage;
