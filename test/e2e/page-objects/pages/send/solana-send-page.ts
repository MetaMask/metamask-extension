import { By } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class SendSolanaPage {
  private driver: Driver;

  private readonly cancelButton = {
    tag: 'button',
    testId: 'send-cancel-button-snap-footer-button',
  };

  private readonly clearToAddressField = '#send-clear-button';

  private readonly continueButton = {
    tag: 'button',
    testId: 'send-submit-button-snap-footer-button',
  };

  private readonly sendAmountInput = '#send-amount-input';

  private readonly swapCurrencyButton = '#send-swap-currency';

  private readonly toAddressInput = '#send-to';

  private readonly toAddressRequiredValidation = {
    tag: 'p',
    text: 'To address is required',
  };

  private readonly amountCurrencyLabel = (tokenName: string) =>
    By.xpath(`//label[@for="send-amount-input"]/..//p[text()="${tokenName}"]`);

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_amountCurrencyIsDisplayed(currency: string): Promise<void> {
    await this.driver.waitForSelector(this.amountCurrencyLabel(currency));
  }

  async check_pageIsLoaded(amount: string = '') {
    await this.driver.waitForSelector(this.toAddressInput, { timeout: 10000 });
    console.log('check_pageIsLoaded after waitForSelector');
    if (amount) {
      await this.driver.waitForSelector(
        {
          text: `${amount}`,
          tag: 'p',
        },
        { timeout: 60000 },
      );
    }
    await this.driver.delay(1000); // Added because of https://consensyssoftware.atlassian.net/browse/SOL-116
  }

  async check_tokenBalanceIsDisplayed(
    amount: string,
    tokenName: string,
  ): Promise<void> {
    await this.driver.clickElement({
      text: `Balance: ${amount} ${tokenName}`,
      tag: 'p',
    });
  }

  async check_tokenByNameIsDisplayed(tokenName: string): Promise<void> {
    await this.driver.waitForSelector(
      {
        text: tokenName,
        tag: 'p',
      },
      { timeout: 2000 },
    );
  }

  async check_TxSimulationFailed(): Promise<void> {
    await this.driver.waitForSelector(
      { text: 'Transaction simulation failed', tag: 'p' },
      { timeout: 5000 },
    );
    await this.driver.waitForSelector(
      { text: 'This transaction was reverted during simulation.', tag: 'p' },
      { timeout: 5000 },
    );
    console.log('Tx simulation failed');
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

  async clearToAddress(): Promise<void> {
    await this.driver.clickElement(this.clearToAddressField);
  }

  async clickOnContinue(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
  }

  async clickOnSwapCurrencyButton(): Promise<void> {
    await this.driver.clickElement(this.swapCurrencyButton);
  }

  async isAmountInputDisplayed(): Promise<boolean> {
    try {
      const input = await this.driver.waitForSelector(this.sendAmountInput, {
        timeout: 1000,
      });
      return await input.isDisplayed();
    } catch (e) {
      console.log('Send amount input not displayed', e);
      return false;
    }
  }

  async isContinueButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.continueButton, {
        timeout: 5000,
      });
    } catch (e) {
      console.log('Continue button not enabled', e);
      return false;
    }
    console.log('Continue button enabled');
    return true;
  }

  async openTokenList(): Promise<void> {
    await this.driver.clickElement(
      By.xpath('//label[@for="send-asset-selector"]/../button'),
    );
  }

  async selectTokenFromTokenList(tokenName: string): Promise<void> {
    await this.driver.clickElement({
      text: tokenName,
      tag: 'p',
    });
  }

  async setAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.sendAmountInput, { timeout: 10000 });
    await this.driver.fill(this.sendAmountInput, amount);
  }

  async setToAddress(toAddress: string): Promise<void> {
    let failed = true;
    for (let i = 0; i < 5 && failed; i++) {
      try {
        await this.driver.fill(this.toAddressInput, toAddress);
        const toAddressRequired = await this.driver.isElementPresent(
          this.toAddressRequiredValidation,
        );
        if (!toAddressRequired) {
          failed = false;
        }
      } catch (err: unknown) {
        console.log('Error encountered, retrying...', err);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

export default SendSolanaPage;
