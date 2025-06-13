import { Driver } from '../../../webdriver/driver';

class BitcoinSendPage {
  private driver: Driver;

  private readonly amountInputField = `input[placeholder="Enter amount to send"]`;

  private readonly maxAmountButton = {
    text: 'Max',
    tag: 'button',
  };

  private readonly recipientInputField = `input[placeholder="Enter receiving address"]`;

  private readonly reviewButton = {
    text: 'Review',
    tag: 'span',
  };

  private readonly totalFee = {
    text: 'Total',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.recipientInputField,
        this.amountInputField,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for bitcoin send page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bitcoin send page is loaded');
  }

  async clickReviewButton() {
    console.log('Click review button on send bitcoin screen');
    await this.driver.waitForSelector(this.totalFee);
    await this.driver.clickElement(this.reviewButton);
  }

  async fillAmount(amount: string): Promise<void> {
    console.log(`Fill amount input with ${amount} on send bitcoin screen`);
    await this.driver.pasteIntoField(this.amountInputField, amount);
  }

  async fillRecipientAddress(recipient: string) {
    console.log(
      `Fill recipient address with ${recipient} on send bitcoin screen`,
    );
    await this.driver.pasteIntoField(this.recipientInputField, recipient);
  }

  async selectMaxAmount() {
    console.log('Select max amount on send bitcoin screen');
    await this.driver.clickElement(this.maxAmountButton);
  }

  /**
   * Verifies that a specific amount is displayed on the send bitcoin screen.
   *
   * @param amount - The expected amount to validate.
   */
  async check_amountIsDisplayed(amount: string) {
    console.log(`Check amount ${amount} is displayed on send bitcoin screen`);
    await this.driver.waitForSelector({
      text: amount,
      tag: 'p',
    });
  }
}

export default BitcoinSendPage;
