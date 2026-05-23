import { Driver } from '../../webdriver/driver';

export default class HardwareWalletErrorModalPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkErrorTitleIsDisplayed(expectedTitle: string): Promise<void> {
    await this.driver.waitForSelector({
      text: expectedTitle,
      tag: 'p',
    });
  }

  async checkRecoveryInstructionsAreDisplayed(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'Continue to make sure:',
      tag: 'p',
    });
  }

  async checkReconnectButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'Reconnect',
      tag: 'button',
    });
  }

  async clickReconnectButton(): Promise<void> {
    await this.driver.clickElement({
      text: 'Reconnect',
      tag: 'button',
    });
  }

  async checkContinueButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'Continue',
      tag: 'button',
    });
  }

  async clickContinueButton(): Promise<void> {
    await this.driver.clickElement({
      text: 'Continue',
      tag: 'button',
    });
  }

  async checkConfirmButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'Confirm',
      tag: 'button',
    });
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElement({
      text: 'Confirm',
      tag: 'button',
    });
  }

  async checkRecoverySuccessIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'Ledger connected',
      tag: 'p',
    });
  }

  async checkErrorModalIsNotDisplayed(): Promise<void> {
    const present = await this.driver.isElementPresent({
      text: 'Something went wrong',
      tag: 'p',
    });
    if (present) {
      throw new Error('Error modal is still displayed');
    }
  }
}
