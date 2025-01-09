import { Driver } from '../../../webdriver/driver';

class SendSolanaPage {
  private driver: Driver;

  private readonly sendAmountInput = '#send-amount-input';

  private readonly toAddressInput = '#send-to';

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
    await this.driver.pasteIntoField(this.sendAmountInput, amount);
  }

  async setToAddress(toAddress: string): Promise<void> {
    await this.driver.pasteIntoField(this.toAddressInput, toAddress);
  }

  async clickOnContinue(): Promise<void> {
    const continueButton = await this.driver.findElement(
      {
        text: 'Continue',
        tag: 'span',
      },
      3000,
    ); // Since the buttons takes a bit to get enabled, this avoid test flakiness
    const clickableButton = await this.driver.findElement(
      '.confirmation-page button:nth-of-type(2)',
    );
    await this.driver.wait(() => clickableButton.isEnabled(), 3000);
    await continueButton.click();
  }

  async isContinueButtonEnabled(): Promise<boolean> {
    try {
      const continueButton = await this.driver.findClickableElement(
        this.continueButton,
        2000,
      );
      await this.driver.delay(2000);
      console.log('Aqui que dice ', await continueButton.isEnabled());
      return await continueButton.isEnabled();
    } catch (e) {
      console.log('Continue button not enabled', e);
      return false;
    }
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

export default SendSolanaPage;
