import { Driver } from '../../../webdriver/driver';

/**
 * Snap-rendered change-trust opt-in confirmation (activate classic trustline).
 *
 * Screen: snap `ConfirmSignChangeTrustOptIn` ("Add {asset} trustline"), shown
 * via `snap_dialog`. In fullscreen E2E that surfaces on `#/confirmation`
 * (notification popup is suppressed while a MetaMask tab is focused).
 * Owns: loaded checks and confirm/cancel snap footer actions.
 * Boundaries: sign-and-send is `SnapTransactionConfirmation`; deactivate
 * opt-out uses different footer testids.
 * Related: `StellarAssetDetailsPage`, `SnapTransactionConfirmation`.
 *
 * @see packages/snap ConfirmSignChangeTrustOptIn in snap-stellar-wallet
 */
class SnapChangeTrustOptInConfirmation {
  private cancelButton = {
    testId: 'confirm-sign-change-trust-opt-in-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-change-trust-opt-in-confirm-snap-footer-button',
    text: 'Confirm',
  };

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private header(assetSymbol: string) {
    return {
      text: `Add ${assetSymbol} trustline`,
      tag: 'h2',
    };
  }

  /**
   * Waits for the opt-in confirmation UI and an enabled Confirm button
   * (security scan must finish — Confirm stays disabled while Fetching).
   *
   * @param assetSymbol - Asset symbol shown in the heading (e.g. AUDD)
   * @param options - Wait options
   * @param options.timeout - Optional selector timeout
   * @param options.requireConfirmEnabled - When false, only asserts UI is present
   */
  async checkPageIsLoaded(
    assetSymbol: string,
    options?: { timeout?: number; requireConfirmEnabled?: boolean },
  ): Promise<void> {
    console.log(
      `Check snap change-trust opt-in confirmation is loaded for ${assetSymbol}`,
    );
    const waitOptions =
      options?.timeout === undefined ? undefined : { timeout: options.timeout };
    await this.driver.waitForMultipleSelectors(
      [this.header(assetSymbol), this.cancelButton, this.confirmButton],
      waitOptions,
    );
    if (options?.requireConfirmEnabled === false) {
      return;
    }
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
      ...(waitOptions ?? {}),
    });
  }

  async clickFooterConfirmButton(): Promise<void> {
    console.log('Clicking change-trust opt-in confirm');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }

  async clickFooterConfirmButtonAndWaitForWindowToClose(): Promise<void> {
    console.log(
      'Clicking change-trust opt-in confirm and waiting for snap dialog to close',
    );
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}

export default SnapChangeTrustOptInConfirmation;
