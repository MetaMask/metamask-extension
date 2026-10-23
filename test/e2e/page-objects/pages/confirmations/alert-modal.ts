import { Driver } from '../../../webdriver/driver';

/**
 * Alert-system modal shown after clicking an inline alert on a confirmation.
 *
 * Screen: overlay modal on top of a confirmation (not a hash route).
 * Owns: selected-alert message assertions and the alert modal confirm/dismiss
 * button.
 * Boundaries: opening the modal (clicking `inline-alert`) stays on the parent
 * confirmation page object (`Confirmation`, `AddNetworkConfirmation`, etc.).
 * This object starts once the alert modal is open.
 * Related: any confirmation that surfaces `data-testid="inline-alert"`.
 *
 * @see ui/components/app/alert-system/alert-modal/alert-modal.tsx
 */
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
