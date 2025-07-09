import { By } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';
import { regularDelayMs } from '../../../helpers';

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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_amountCurrencyIsDisplayed(currency: string): Promise<void> {
    await this.driver.waitForSelector(this.amountCurrencyLabel(currency));
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(amount: string = '') {
    await this.driver.waitForSelector(this.toAddressInput, { timeout: 10000 });
    console.log('check_pageIsLoaded after waitForSelector');
    if (amount) {
      await this.driver.wait(async () => {
        try {
          await this.driver.waitForSelector(
            {
              text: `${amount}`,
              tag: 'p',
            },
            { timeout: 1000 },
          );
          return true;
        } catch (e) {
          await this.driver.refresh();
          return false;
        }
      }, 60000);
    }
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenBalanceIsDisplayed(
    amount: string,
    tokenName: string,
  ): Promise<void> {
    await this.driver.clickElement({
      text: `Balance: ${amount} ${tokenName}`,
      tag: 'p',
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenByNameIsDisplayed(tokenName: string): Promise<void> {
    await this.driver.waitForSelector(
      {
        text: tokenName,
        tag: 'p',
      },
      { timeout: 2000 },
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
        timeout: 2000,
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
    await this.driver.delay(regularDelayMs);
    await this.driver.fill(this.toAddressInput, toAddress);
  }
}

export default SendSolanaPage;
