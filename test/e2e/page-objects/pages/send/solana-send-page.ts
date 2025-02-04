import { Driver } from '../../../webdriver/driver';

class SendSolanaPage {
  private driver: Driver;

  private readonly sendAmountInput = '#send-amount-input';

  private readonly toAddressInput = '#send-to';

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly swapCurrencyButton = '#send-swap-currency';

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickOnSwapCurrencyButton(): Promise<void> {
    await this.driver.waitForControllersLoaded();
    const swapCurrencyButton = await this.driver.waitForSelector(
      this.swapCurrencyButton,
      { timeout: 10000 },
    );
    await swapCurrencyButton.click();
  }

  async check_validationErrorAppears(
    validationErrorText: string,
  ): Promise<boolean> {
    try {
      await this.driver.waitForSelector(
        {
          text: validationErrorText,
          tag: 'p',
        },
        { timeout: 5000 },
      );
      return true;
    } catch (e) {
      console.log(`${validationErrorText} is not displayed`);
      return false;
    }
  }

  async setAmount(amount: string): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.waitForSelector(this.sendAmountInput, { timeout: 10000 });
    await this.driver.pasteIntoField(this.sendAmountInput, amount);
  }

  async setToAddress(toAddress: string): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.waitForSelector(this.toAddressInput, { timeout: 10000 });
    await this.driver.pasteIntoField(this.toAddressInput, toAddress);
  }

  async clickOnContinue(): Promise<void> {
    const continueButton = await this.driver.waitForSelector(
      {
        text: 'Continue',
        tag: 'span',
      },
      { timeout: 5000 },
    ); // Since the buttons takes a bit to get enabled, this avoid test flakiness
    const clickableButton = await this.driver.findElement(
      '.confirmation-page button:nth-of-type(2)',
    );
    await this.driver.wait(() => clickableButton.isEnabled());
    await continueButton.click();
  }

  async isContinueButtonEnabled(): Promise<boolean> {
    try {
      const continueButton = await this.driver.findClickableElement(
        this.continueButton,
        2000,
      );
      await this.driver.wait(
        async () => await continueButton.isEnabled(),
        5000,
      );
      return await continueButton.isEnabled();
    } catch (e) {
      console.log('Continue button not enabled', e);
      return false;
    }
  }
}

export default SendSolanaPage;
