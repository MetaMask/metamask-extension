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

  private readonly assetPicker = {
    tag: 'label',
    text: 'Asset',
  };

  private readonly amountField = {
    tag: 'label',
    text: 'Amount',
  };

  private readonly clearRecipientButton = '#clearRecipient';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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

  async checkAssetPickerIsDisplayed() {
    console.log('Check asset picker is displayed on send bitcoin screen');
    try {
      await this.driver.waitForSelector(this.assetPicker, { timeout: 1000 });
      return true;
    } catch (e) {
      console.log('Timeout while waiting for asset picker to be displayed', e);
      return false;
    }
  }

  async checkAmountFieldIsDisplayed() {
    console.log('Check amount field is displayed on send bitcoin screen');
    try {
      await this.driver.waitForSelector(this.amountField, { timeout: 1000 });
      return true;
    } catch (e) {
      console.log('Timeout while waiting for amount field to be displayed', e);
      return false;
    }
  }

  async checkAddressFieldValidationError(error: string) {
    console.log(
      'Check invalid BTC address is displayed on send bitcoin screen',
    );
    await this.driver.waitForSelector({
      tag: 'p',
      text: error,
    });
  }

  async checkContinueButtonIsDisabled() {
    try {
      const continueButton = await this.driver.waitForSelector(
        this.continueButton,
        { timeout: 1000 },
      );
      const isDisabled = await continueButton.getAttribute('disabled');
      console.log('Is disabled', isDisabled);
      return isDisabled === 'true';
    } catch (error) {
      console.error('Error checking if Continue button is enabled:', error);
      return false; // Return false if an error occurs
    }
  }

  async checkAmountValidationError(error: string) {
    console.log(
      'Check amount validation error is displayed on send bitcoin screen',
    );
    await this.driver.waitForSelector({
      tag: 'p',
      text: error,
    });
  }

  async clearRecipientAddress() {
    console.log('Clear recipient address on send bitcoin screen');
    await this.driver.clickElement(this.clearRecipientButton);
  }
}

export default BitcoinSendPage;
