import { Driver } from '../../../../webdriver/driver';

class AlertModal {
  private driver: Driver;

  private insufficientFundsAlert = {
    css: '[data-testid="alert-modal__selected-alert"]',
    text: 'You do not have enough ETH in your account to pay for network fees.',
  };

  private confirmAlertButton = '[data-testid="alert-modal-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.confirmAlertButton);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_insufficientBalanceMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check insufficient balance message is displayed on alert modal',
    );
    await this.driver.waitForSelector(this.insufficientFundsAlert);
  }
}

export default AlertModal;
