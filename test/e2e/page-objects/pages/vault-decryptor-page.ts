import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../helpers';

class VaultDecryptorPage {
  private driver: Driver;

  private readonly decryptButton = {
    text: 'Decrypt',
    tag: 'button',
  };

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

  /**
   * Checks if the vault is decrypted and the seed phrase is correct.
   *
   * @param seedPhrase - The expected seed phrase.
   */
  async checkVaultIsDecrypted(seedPhrase: string) {
    console.log('check vault is decrypted on vault decryptor page');
    await this.driver.waitForSelector({
      text: seedPhrase,
      tag: 'div',
    });
  }
}

export default VaultDecryptorPage;
