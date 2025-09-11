import { Driver } from '../../../../webdriver/driver';

class GetEncryptionKeyConfirmation {
  driver: Driver;

  private readonly accountBalanceValue =
    '.request-encryption-public-key__balance-value';

  private readonly getEncryptionKeyConfirmationTitle = {
    text: 'Request encryption public key',
    css: '.request-encryption-public-key__header__text',
  };

  private readonly provideEncryptionKeyButton = {
    text: 'Provide',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.getEncryptionKeyConfirmationTitle,
        this.provideEncryptionKeyButton,
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for get encryption key confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Get encryption key confirmation page is loaded`);
  }

  async clickToConfirmProvideEncryptionKey(): Promise<void> {
    console.log(
      'Click to confirm provide encryption key on get encryption key confirmation page',
    );
    await this.driver.clickElementAndWaitForWindowToClose(
      this.provideEncryptionKeyButton,
    );
  }

  /**
   * Check the account balance value in get encryption key confirmation page.
   *
   * @param balanceValue - The balance value to check.
   */
  async checkAccountBalance(balanceValue: string): Promise<void> {
    console.log(
      'Check account balance on get encryption key confirmation screen: ',
      balanceValue,
    );
    await this.driver.waitForSelector({
      css: this.accountBalanceValue,
      text: balanceValue,
    });
  }
}

export default GetEncryptionKeyConfirmation;
