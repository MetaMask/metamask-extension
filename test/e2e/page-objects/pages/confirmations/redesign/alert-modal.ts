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

  async clickAlertModalButton(): Promise<void> {
    await this.driver.clickElement(this.confirmAlertButton);
  }
  async check_AlertInsufficientBalance(): Promise<void> {
    await this.driver.clickElement(this.insufficientFundsAlert);
  }
}

export default AlertModal;
