import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';

/**
 * Page object for the Speed up / Cancel transaction modal.
 * Used when user clicks "Speed up" or "Cancel" on a pending transaction in the activity list.
 */
export default class SpeedUpAndCancelModal {
  private driver: Driver;

  private readonly modal: RawLocator =
    '[data-testid="speed-up-and-cancel-modal"]';

  private readonly cancelTransactionTitle: RawLocator = {
    text: 'Cancel transaction',
  };

  private readonly speedUpTransactionTitle: RawLocator = {
    text: 'Speed up transaction',
  };

  private readonly speedRow: RawLocator =
    '[data-testid="gas-fee-details-speed"]';

  private readonly siteSuggestedText: RawLocator = {
    text: 'Site suggested',
  };

  private readonly confirmButton: RawLocator =
    '[data-testid="cancel-speedup-confirm-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the modal to be visible.
   */
  async waitForModal(): Promise<void> {
    console.log('Waiting for Speed up / Cancel modal');
    await this.driver.waitForSelector(this.modal);
  }

  /**
   * Checks that the modal is showing the "Cancel transaction" title.
   */
  async checkCancelTitleVisible(): Promise<void> {
    console.log('Checking Cancel transaction title is visible');
    await this.driver.waitForSelector(this.cancelTransactionTitle);
  }

  /**
   * Checks that the modal is showing the "Speed up transaction" title.
   */
  async checkSpeedUpTitleVisible(): Promise<void> {
    console.log('Checking Speed up transaction title is visible');
    await this.driver.waitForSelector(this.speedUpTransactionTitle);
  }

  /**
   * Checks that the Speed row in the modal displays "Site suggested".
   */
  async checkSpeedRowShowsSiteSuggested(): Promise<void> {
    console.log('Checking Speed row shows Site suggested');
    await this.driver.waitForSelector(this.speedRow);
    await this.driver.waitForSelector(this.siteSuggestedText);
  }

  /**
   * Waits for the Confirm button to be enabled (replacement state ready).
   * Use before clickConfirm() to avoid submitting before previousGas is set.
   */
  async waitForConfirmEnabled(): Promise<void> {
    console.log('Waiting for Confirm button to be enabled');
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
    });
  }

  /**
   * Clicks the Confirm button to submit the speed up or cancel action.
   */
  async clickConfirm(): Promise<void> {
    console.log('Clicking Confirm on Speed up / Cancel modal');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }
}
