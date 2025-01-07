import { strict as assert, constructor } from 'assert';
import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class ConfirmSolanaTxPage {
  private driver: Driver;

  private readonly sendAmountInput = '#send-amount-input';

  private readonly toAddressInput = '#send-to'

  private readonly sendButton = {
    text: 'Send',
    tag: 'button',
  };

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAmountDisplayed(amount: string): Promise<boolean> {
    try {
    await this.driver.findElement({
      text: `Sending ${amount} SOL`,
      tag: 'h2',
    });
    return true;
  } catch (err) {
    console.log('Amount summary text incorrect');
    return false;
    }
  }

  async isTrancsactionDetailDisplayed(text: string): Promise<boolean> {
    const detail = await this.driver.findElement({
      text,
      tag: 'p',
    }, 200)
    return await detail.isDisplayed();
  }

  async setToAddress(toAddress: string): Promise<void> {
    await this.driver.pasteIntoField(this.toAddressInput, toAddress)
  }

  async clickOnContinue(): Promise<void> {
    await this.driver.clickElement(this.continueButton)
  }

  async isContinueButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.continueButton, 1000);
    } catch (e) {
      console.log('Continue button not enabled', e);
      return false;
    }
    console.log('Continue button is enabled');
    return true;
  }

  async isInsufficientBalanceDisplayed(): Promise<boolean> {
    try {
      await this.driver.findClickableElement({
        text: 'Insufficient balance',
        tag: 'p',
      }, 1000);
    } catch (e) {
      console.log('Insufficient balance message not displayed', e);
      return false;
    }
    console.log('Insufficient balance message displayed');
    return true;
  }
}

export default ConfirmSolanaTxPage;
