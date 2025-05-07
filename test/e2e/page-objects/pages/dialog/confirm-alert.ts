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

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async rejectFromAlertModal() {
    this.driver.clickElement(this.alertModalCancelButton);
  }

  async confirmFromAlertModal() {
    this.driver.clickElement(this.alertModalAcknowledgeCheckBox);
    this.driver.clickElement(this.alertModalSubmitButton);
  }

  async acknowledgeAlert() {
    this.driver.clickElement(this.alertModalAcknowledgeCheckBox);
    this.driver.clickElement(this.alertModalButton);
  }
}

export default ConfirmAlertModal;
