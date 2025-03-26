import { Driver } from '../../../../webdriver/driver';

class AlertModal {
  private driver: Driver;

  private alertModalSelectedAlert = {
    css: '[data-testid="alert-modal__selected-alert"]',
    text: 'You do not have enough ETH in your account to pay for network fees.',
  };

  private inlineAlertButton = {
    css: '[data-testid="inline-alert"]',
    text: 'Alert',
  };

  private alertModalButton = '[data-testid="alert-modal-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async waitForAlert() {
    await this.driver.waitForSelector(this.inlineAlertButton);
  }

  async waitForInsufficientBalanceAlert() {
    await this.driver.waitForSelector(this.alertModalSelectedAlert);
  }

  async clickAlertModalButton() {
    await this.driver.clickElement(this.alertModalButton);
  }

}

export default AlertModal;