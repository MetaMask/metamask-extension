import { Driver } from '../../../webdriver/driver';

class SolanaTxresultPage {
  private driver: Driver;

  private readonly closeButton = {
    text: 'Close',
    tag: 'span',
  };

  private readonly viewTransactionLink = {
    text: 'View transaction',
    tag: 'span',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkIsViewTransactionLinkDisplayed() {
    try {
      await this.driver.findClickableElement(this.viewTransactionLink);
      return true;
    } catch (err) {
      console.log('View transaction link not displayed');
      return false;
    }
  }

  async checkTransactionStatus(sent: boolean): Promise<boolean> {
    const statusText = sent ? 'Sent' : 'Transaction failed';
    try {
      await this.driver.findElement({
        text: statusText,
        tag: 'h2',
      });
      return true;
    } catch (err) {
      console.log('Transaction status incorrect');
      return false;
    }
  }

  async checkTransactionStatusText(
    amount: string,
    sent: boolean,
    tokenName: string = 'SOL',
  ): Promise<boolean> {
    const displayedText = sent
      ? `${amount} ${tokenName} was successfully sent`
      : `Unable to send ${amount}`;
    const txStatusText = {
      text: displayedText,
      tag: 'p',
    };
    try {
      await this.driver.waitForSelector(
        txStatusText,
        { timeout: 10000 }, // even the tx is being mock, there is an spinner that sometimes is slow to disappear
      );
      return true;
    } catch (err) {
      console.log(
        `Transaction status text incorrect, expected ${displayedText} did not match`,
      );
      return false;
    }
  }

  async isTransactionDetailDisplayed(text: string): Promise<boolean> {
    const detail = await this.driver.waitForSelector({
      text,
      tag: 'p',
    });
    return await detail.isDisplayed();
  }

  async clickOnClose(): Promise<void> {
    await this.driver.clickElement(this.closeButton);
  }
}

export default SolanaTxresultPage;
