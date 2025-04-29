import { By } from 'selenium-webdriver';
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

  private readonly clearToAddressField = '#send-clear-button';

  private readonly amountCurrencyLabel = (tokenName: string) =>
    By.xpath(`//label[@for="send-amount-input"]/..//p[text()="${tokenName}"]`);

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
    await this.driver.fill(this.sendAmountInput, amount);
  }

  async clearToAddress(): Promise<void> {
    const input = await this.driver.waitForSelector(this.clearToAddressField, {
      timeout: 10000,
    });
    await input.click();
  }

  async setToAddress(toAddress: string): Promise<void> {
    let failed = true;
    for (let i = 0; i < 5 && failed; i++) {
      try {
        await this.driver.waitForControllersLoaded();
        await this.driver.waitForSelector(this.toAddressInput, {
          timeout: 5000,
        });
        await this.driver.fill(this.toAddressInput, toAddress);
        failed = false;
      } catch (err: unknown) {
        console.log('To address input not displayed', err);
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          err.name === 'StaleElementReferenceError'
        ) {
          console.log('StaleElementReferenceError encountered, retrying...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          throw err;
        }
      }
    }
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
      await this.driver.findClickableElement(this.continueButton, {
        timeout: 5000,
      });
    } catch (e) {
      console.log('Continue button is not clickable', e);
      return false;
    }
    console.log('Continue button is clickable');
    return true;
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

  async check_pageIsLoaded(amount: string = '') {
    await this.driver.waitForControllersLoaded();
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

  async check_TxSimulationFailed(): Promise<void> {
    await this.driver.waitForControllersLoaded();
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

  async check_tokenByNameIsDisplayed(tokenName: string): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.waitForSelector(
      {
        text: tokenName,
        tag: 'p',
      },
      { timeout: 2000 },
    );
  }

  async selectTokenFromTokenList(tokenName: string): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.clickElement({
      text: tokenName,
      tag: 'p',
    });
  }

  async check_tokenBalanceIsDisplayed(
    amount: string,
    tokenName: string,
  ): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.clickElement({
      text: `Balance: ${amount} ${tokenName}`,
      tag: 'p',
    });
  }

  async check_amountCurrencyIsDisplayed(currency: string): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.waitForSelector(this.amountCurrencyLabel(currency));
  }

  async openTokenList(): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.clickElement(
      By.xpath('//label[@for="send-asset-selector"]/../button'),
    );
  }
}

export default SendSolanaPage;
