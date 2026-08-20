import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../constants';

/**
 * External vault-decryptor webapp for recovering seed from vault JSON/logs.
 *
 * Screen: hosted vault-decryptor app
 * (`https://metamask.github.io/vault-decryptor`), not a MetaMask route and not
 * vendored in this repo.
 * Owns: file/text vault input modes, password entry, decrypt confirm, and
 * decrypted seed-phrase assertion.
 * Boundaries: the external decryptor page only. Extension log export and
 * critical-error recovery UI belong to extension page objects.
 * Related: `CriticalErrorPage` / `VaultRecoveryPage` for in-extension recovery;
 * `test/e2e/dist/vault-decryption-chrome.spec.ts` for usage.
 */
class VaultDecryptorPage {
  private readonly decryptButton = {
    text: 'Decrypt',
    tag: 'button',
  };

  private driver: Driver;

  private readonly fileInput = '#fileinput';

  private readonly passwordInput = '#passwordinput';

  private readonly radioFileInput = '#radio-fileinput';

  private readonly radioTextInput = '#radio-textinput';

  private readonly textInput = '#textinput';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.fileInput,
        this.textInput,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Vault Decryptor page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Vault Decryptor page is loaded');
  }

  /**
   * Checks if the vault is decrypted and the seed phrase is correct.
   *
   * @param seedPhrase - The expected seed phrase (may include numbered lines from MetaMask UI, e.g. "1.\nvehicle").
   */
  async checkVaultIsDecrypted(seedPhrase: string) {
    // Normalize MetaMask UI format ("1.\nvehicle") to vault-decryptor format ("vehicle") in one pass
    const normalizedPhrase = seedPhrase
      .replace(/\d+\.\s*|\r?\n/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim();
    console.log('check vault is decrypted on vault decryptor page');
    await this.driver.waitForSelector({
      text: normalizedPhrase,
      tag: 'div',
    });
  }

  /**
   * Confirm the decryption process on the Vault Decryptor page.
   */
  async confirmDecrypt() {
    console.log('click to confirm decrypt on vault decryptor page');
    await this.driver.clickElement(this.decryptButton);
  }

  /**
   * Fill the password input field with the specified password.
   *
   * @param password - The password to fill in the password input field. Defaults to WALLET_PASSWORD.
   */
  async fillPassword(password: string = WALLET_PASSWORD) {
    await this.driver.fill(this.passwordInput, password);
  }

  /**
   * Fill the text input field with the specified vault text.
   *
   * @param vaultText - The text to fill in the text input field.
   */
  async fillVaultText(vaultText: string) {
    console.log('fill vault text on vault decryptor page');
    await this.driver.clickElement(this.radioTextInput);
    await this.driver.fill(this.textInput, vaultText);
  }

  /**
   * Uploads a log file to the Vault Decryptor page.
   *
   * @param filePath - The path to the log file to upload.
   */
  async uploadLogFile(filePath: string) {
    console.log('upload log file on vault decryptor page');
    await this.driver.clickElement(this.radioFileInput);
    const inputField = await this.driver.findElement(this.fileInput);
    await inputField.sendKeys(filePath);
  }
}

export default VaultDecryptorPage;
