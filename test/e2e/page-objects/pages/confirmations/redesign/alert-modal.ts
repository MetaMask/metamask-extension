import { Driver } from '../../../../webdriver/driver';

class AlertModal {
  private driver: Driver;

  private insufficientFundsAlert = {
    css: '[data-testid="alert-modal__selected-alert"]',
    text: 'You do not have enough ETH in your account to pay for network fees.',
  };

  private inlineAlertButton = {
    css: '[data-testid="inline-alert"]',
    text: 'Alert',
  };

  private confirmAlertButton = '[data-testid="alert-modal-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async waitForAlert(): Promise<void> {
    await this.driver.waitForSelector(this.inlineAlertButton);
  }

  async waitForInsufficientBalanceAlert(): Promise<void> {
    await this.driver.waitForSelector(this.insufficientFundsAlert);
  }

  async clickAlertModalButton(): Promise<void> {
    await this.driver.clickElement(this.confirmAlertButton);
  }
}

export default AlertModal;
