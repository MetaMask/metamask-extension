import { Driver } from '../../../../webdriver/driver';

class DecryptMessageConfirmation {
  driver: Driver;

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

  constructor(driver: Driver) {
    this.driver = driver;
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
}

export default DecryptMessageConfirmation;
