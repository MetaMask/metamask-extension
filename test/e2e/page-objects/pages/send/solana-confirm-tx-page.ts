import { Driver } from '../../../webdriver/driver';

class ConfirmSolanaTxPage {
  private driver: Driver;

  private readonly toAddressInput = '#send-to';

  private readonly sendButton = {
    text: 'Send',
    tag: 'span',
  };

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'span',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAmountDisplayed(
    amount: string,
    currency: string = 'SOL',
  ): Promise<boolean> {
    try {
      await this.driver.waitForSelector({
        text: `Sending ${amount} ${currency}`,
        tag: 'h2',
      });
      return true;
    } catch (err) {
      console.log('Amount summary text incorrect');
      return false;
    }
  }

  async isTransactionDetailDisplayed(text: string): Promise<boolean> {
    const detail = await this.driver.findElement(
      {
        text,
        tag: 'p',
      },
      200,
    );
    return await detail.isDisplayed();
  }

  async setToAddress(toAddress: string): Promise<void> {
    await this.driver.pasteIntoField(this.toAddressInput, toAddress);
  }

  /**
   * Clicks the send button on the Solana transaction confirmation page
   */
  async clickOnSend(): Promise<void> {
    const sendButton = await this.driver.findElement(this.sendButton);
    await sendButton.click();
  }

  async isSendButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.sendButton, 1000);
    } catch (e) {
      console.log('Send button not enabled', e);
      return false;
    }
    console.log('Send button is enabled');
    return true;
  }

  async isInsufficientBalanceDisplayed(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(
        {
          text: 'Insufficient balance',
          tag: 'p',
        },
        1000,
      );
    } catch (e) {
      console.log('Insufficient balance message not displayed', e);
      return false;
    }
    console.log('Insufficient balance message displayed');
    return true;
  }
}

export default ConfirmSolanaTxPage;
