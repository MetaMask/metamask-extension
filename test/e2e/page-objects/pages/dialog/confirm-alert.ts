import { Driver } from '../../../webdriver/driver';

/**
 * Confirm-alert modal shown when confirming despite blocking confirmation alerts.
 *
 * Screen: modal layered over an open confirmation (signature/transaction),
 * opened when the user proceeds past alert warnings that require acknowledge /
 * confirm-from-alert.
 * Owns: acknowledge checkbox, alert dismiss/submit/cancel controls, and
 * optional network name display check.
 * Boundaries: stops at the alert modal. The underlying confirmation page object
 * owns the parent confirm screen; generic alert modal actions for network
 * switch pending-confirmation alerts belong to `NetworkSwitchAlertModal`.
 * Related: confirmation page objects, `NetworkSwitchAlertModal`.
 *
 * @see ui/components/app/alert-system/confirm-alert-modal/confirm-alert-modal.tsx
 */
class ConfirmAlertModal {
  private alertModalAcknowledgeCheckBox =
    '[data-testid="alert-modal-acknowledge-checkbox"]';

  private alertModalButton = '[data-testid="alert-modal-button"]';

  private alertModalCancelButton =
    '[data-testid="confirm-alert-modal-cancel-button"]';

  private alertModalSubmitButton =
    '[data-testid="confirm-alert-modal-submit-button"]';

  protected driver: Driver;

  private networkDisplayLocator = {
    css: 'p',
    text: '',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async acknowledgeAlert() {
    await this.driver.clickElement(this.alertModalAcknowledgeCheckBox);
    await this.driver.clickElement(this.alertModalButton);
  }

  async confirmFromAlertModal() {
    await this.driver.clickElement(this.alertModalAcknowledgeCheckBox);
    await this.driver.clickElement(this.alertModalSubmitButton);
  }

  async rejectFromAlertModal() {
    await this.driver.clickElement(this.alertModalCancelButton);
  }

  async verifyNetworkDisplay(networkName: string): Promise<void> {
    this.networkDisplayLocator.text = networkName;
    await this.driver.waitForSelector(this.networkDisplayLocator);
  }
}

export default ConfirmAlertModal;
