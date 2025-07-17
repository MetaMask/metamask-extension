import { Driver } from '../../../webdriver/driver';

class ConfirmAlertModal {
  protected driver: Driver;

  private alertModalAcknowledgeCheckBox =
    '[data-testid="alert-modal-acknowledge-checkbox"]';

  private alertModalButton = '[data-testid="alert-modal-button"]';

  private alertModalSubmitButton =
    '[data-testid="confirm-alert-modal-submit-button"]';

  private alertModalCancelButton =
    '[data-testid="confirm-alert-modal-cancel-button"]';

  private networkDisplayLocator = {
    css: 'p',
    text: '',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async rejectFromAlertModal() {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.driver.clickElement(this.alertModalCancelButton);
  }

  async confirmFromAlertModal() {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.driver.clickElement(this.alertModalAcknowledgeCheckBox);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.driver.clickElement(this.alertModalSubmitButton);
  }

  async acknowledgeAlert() {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.driver.clickElement(this.alertModalAcknowledgeCheckBox);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.driver.clickElement(this.alertModalButton);
  }

  async verifyNetworkDisplay(networkName: string): Promise<void> {
    this.networkDisplayLocator.text = networkName;
    await this.driver.waitForSelector(this.networkDisplayLocator);
  }
}

export default ConfirmAlertModal;
