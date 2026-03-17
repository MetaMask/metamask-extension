import { Driver } from '../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

export default class DowngradeConfirmation extends TransactionConfirmation {
  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  protected driver: Driver;

  private readonly downgradeMessage = '[data-testid="downgrade-message"]';

  private readonly downgradeButton = '[data-testid="footer-confirm-button"]';

  private readonly cancelButton = '[data-testid="footer-cancel-button"]';

  private readonly downgradeBanner =
    '[data-testid="transaction-details-section"]';

  async checkDowngradeMessageIsDisplayed(): Promise<void> {
    console.log('Checking downgrade message is displayed');
    await this.driver.waitForSelector({
      css: this.downgradeBanner,
      text: "You're switching back to a standard account (EOA).",
    });
  }

  async checkAccountDowngradePromptDisplayed(
    accountName: string,
  ): Promise<void> {
    console.log(`Checking account downgrade prompt for ${accountName}`);
    await this.driver.waitForSelector({
      css: this.downgradeBanner,
      text: accountName,
    });
  }

  async clickDowngradeButton(): Promise<void> {
    console.log('Clicking downgrade button');
    await this.driver.clickElement(this.downgradeButton);
  }

  async clickCancelButton(): Promise<void> {
    console.log('Clicking cancel button');
    await this.driver.clickElement(this.cancelButton);
  }

  async confirmDowngrade(): Promise<void> {
    await this.checkDowngradeMessageIsDisplayed();
    await this.clickFooterConfirmButton();
  }
}
