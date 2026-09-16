import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';

/**
 * Speed up / cancel replacement-transaction modal for a pending activity item.
 *
 * Screen: overlay modal from the activity list Speed up or Cancel action (not
 * a `#/confirmation` route).
 * Owns: cancel vs speed-up titles, speed/increase row, and confirm when the
 * replacement gas state is ready.
 * Boundaries: the activity list click that opens this modal is outside this
 * object. Full redesigned confirmation gas editing is `GasFeeModal`.
 * Related: home/activity list page objects that open Speed up or Cancel.
 *
 * @see ui/pages/confirmations/cancel-speedup/cancel-speedup.tsx
 */
export default class SpeedUpAndCancelModal {
  private readonly cancelTransactionTitle: RawLocator = {
    text: 'Cancel transaction',
  };

  private readonly confirmButton: RawLocator =
    '[data-testid="cancel-speedup-confirm-button"]';

  private driver: Driver;

  private readonly modal: RawLocator =
    '[data-testid="speed-up-and-cancel-modal"]';

  private readonly speedRow: RawLocator =
    '[data-testid="gas-fee-details-speed"]';

  private readonly speedUpTransactionTitle: RawLocator = {
    text: 'Speed up transaction',
  };

  private readonly tenPercentText: RawLocator = {
    text: '10% increase',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks that the modal is showing the "Cancel transaction" title.
   */
  async checkCancelTitleVisible(): Promise<void> {
    console.log('Checking Cancel transaction title is visible');
    await this.driver.waitForSelector(this.cancelTransactionTitle);
  }

  /**
   * Checks that the Speed row in the modal displays "10% increased".
   */
  async checkSpeedRowShowsTenPercentIncreased(): Promise<void> {
    console.log('Checking Speed row shows 10% increased');
    await this.driver.waitForSelector(this.speedRow);
    await this.driver.waitForSelector(this.tenPercentText);
  }

  /**
   * Checks that the modal is showing the "Speed up transaction" title.
   */
  async checkSpeedUpTitleVisible(): Promise<void> {
    console.log('Checking Speed up transaction title is visible');
    await this.driver.waitForSelector(this.speedUpTransactionTitle);
  }

  /**
   * Clicks the Confirm button to submit the speed up or cancel action.
   */
  async clickConfirm(): Promise<void> {
    console.log('Clicking Confirm on Speed up / Cancel modal');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
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
   * Waits for the modal to be visible.
   */
  async waitForModal(): Promise<void> {
    console.log('Waiting for Speed up / Cancel modal');
    await this.driver.waitForSelector(this.modal);
  }
}
