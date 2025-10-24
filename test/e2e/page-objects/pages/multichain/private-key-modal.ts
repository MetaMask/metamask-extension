import { Driver } from '../../../webdriver/driver';

class PrivateKeyModal {
  private driver: Driver;

  private readonly privateKeyPasswordInput =
    '[data-testid="multichain-private-key-password-input"]';

  private readonly confirmButton = '[data-testid="confirm-button"]';

  private readonly backButton = '[aria-label="Close"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.privateKeyPasswordInput,
        this.confirmButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for private key modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Private key modal is loaded');
  }

  /**
   * Enter Password
   *
   * @param password
   */
  async typePassword(password: string): Promise<void> {
    await this.driver.fill(this.privateKeyPasswordInput, password);
  }

  /**
   * Confirm button
   */
  async clickConfirm(): Promise<void> {
    await this.driver.clickElement(this.confirmButton);
  }
}

export default PrivateKeyModal;
