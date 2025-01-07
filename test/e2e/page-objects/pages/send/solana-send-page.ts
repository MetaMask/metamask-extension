import { strict as assert } from 'assert';
import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class SendSolanaPage {
  private driver: Driver;

  private readonly sendAmountInput = '#send-amount-input';

  private readonly toAddressInput = '#send-to'

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async setAmount(amount: string): Promise<void> {
    await this.driver.pasteIntoField(this.sendAmountInput,  amount)
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

export default SendSolanaPage;
