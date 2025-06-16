import { Driver } from '../../../webdriver/driver';

class BitcoinSendPage {
  private driver: Driver;

  private readonly amountInput = '#amount';

  private readonly maxAmountButton = {
    text: 'Max',
    tag: 'button',
  };

  private readonly recipientInput = `#recipient`;

  private readonly continueButton = {
    tag: 'button',
    testId: 'confirm-snap-footer-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.recipientInput);
    } catch (e) {
      console.log(
        'Timeout while waiting for bitcoin send page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bitcoin send page is loaded');
  }

  async clickContinueButton() {
    console.log('Click continue button on send bitcoin screen');
    await this.driver.clickElement(this.continueButton);
  }

  async fillAmount(amount: string): Promise<void> {
    console.log(`Fill amount input with ${amount} on send bitcoin screen`);
    await this.driver.waitForSelector(this.amountInput, { timeout: 10000 });
    await this.driver.fill(this.amountInput, amount);
  }

  async fillRecipientAddress(recipient: string) {
    console.log(
      `Fill recipient address with ${recipient} on send bitcoin screen`,
    );
    await this.driver.fill(this.recipientInput, recipient);
  }

  async selectMaxAmount() {
    console.log('Select max amount on send bitcoin screen');
    await this.driver.waitForSelector(this.amountInput, { timeout: 10000 });
    await this.driver.clickElement(this.maxAmountButton);
  }
}

export default BitcoinSendPage;
