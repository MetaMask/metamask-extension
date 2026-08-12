import { Driver } from '../../../webdriver/driver';

class AlertModal {
  private confirmAlertButton = '[data-testid="alert-modal-button"]';

  private driver: Driver;

  private insufficientFundsAlert = {
    css: '[data-testid="alert-modal__selected-alert"]',
    text: 'You do not have enough ETH in your account to pay for network fees.',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkInsufficientBalanceMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check insufficient balance message is displayed on alert modal',
    );
    await this.driver.waitForSelector(this.insufficientFundsAlert);
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.confirmAlertButton);
  }
}

export default AlertModal;
