import { Driver } from '../../../webdriver/driver';

/**
 * Decrypt-message request confirmation (`eth_decrypt`).
 *
 * Screen: `#/confirm-transaction/:id/decrypt-message` (legacy decrypt page,
 * not redesigned `#/confirmation`).
 * Owns: decrypt request title, account balance, decrypt-message CTA,
 * decrypted message text, and final Decrypt confirm.
 * Boundaries: encryption public key requests are
 * `GetEncryptionKeyConfirmation`. Signature confirms are separate classes.
 * Related: `GetEncryptionKeyConfirmation`.
 *
 * @see ui/pages/confirm-decrypt-message/confirm-decrypt-message.component.js
 */
class DecryptMessageConfirmation {
  private readonly accountBalanceValue =
    '.request-decrypt-message__balance-value';

  private readonly confirmDecryptMessageButton = {
    text: 'Decrypt',
    tag: 'button',
  };

  private readonly decryptedMessage = '.request-decrypt-message__message-text';

  private readonly decryptMessageButton = {
    text: 'Decrypt message',
    tag: 'div',
  };

  private readonly decryptMessageConfirmationTitle = {
    text: 'Decrypt request',
    css: '.request-decrypt-message__header__text',
  };

  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check the account balance value in decrypt message confirmation page.
   *
   * @param balanceValue - The balance value to check.
   */
  async checkAccountBalance(balanceValue: string): Promise<void> {
    console.log(
      'Check account balance on decrypt message confirmation screen: ',
      balanceValue,
    );
    await this.driver.waitForSelector({
      css: this.accountBalanceValue,
      text: balanceValue,
    });
  }

  /**
   * Check the decrypted message on decrypt message confirmation page.
   *
   * @param message - The decrypted message to check.
   */
  async checkDecryptedMessage(message: string): Promise<void> {
    console.log('Check decrypted message on decrypt message confirmation page');
    await this.driver.waitForSelector({
      css: this.decryptedMessage,
      text: message,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.decryptMessageConfirmationTitle,
        this.decryptMessageButton,
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for decrypt message confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Decrypt message confirmation page is loaded`);
  }

  async clickDecryptMessageButton(): Promise<void> {
    console.log(
      'Click decrypt message button on decrypt message confirmation page',
    );
    await this.driver.clickElement(this.decryptMessageButton);
  }

  async clickToConfirmDecryptMessage(): Promise<void> {
    console.log(
      'Click to confirm decrypt message on decrypt message confirmation page',
    );
    await this.driver.clickElement(this.confirmDecryptMessageButton);
  }
}

export default DecryptMessageConfirmation;
