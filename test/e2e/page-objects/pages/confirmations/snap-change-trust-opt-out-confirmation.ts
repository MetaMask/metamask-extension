import { Driver } from '../../../webdriver/driver';

/**
 * Snap-rendered change-trust opt-out confirmation (deactivate classic trustline).
 *
 * Screen: snap `ConfirmSignChangeTrustOptOut` ("Remove {asset} trustline"),
 * shown via `snap_dialog`. In fullscreen E2E that surfaces on `#/confirmation`
 * (notification popup is suppressed while a MetaMask tab is focused).
 * Owns: loaded checks and confirm/cancel snap footer actions.
 * Boundaries: opt-in activate is `SnapChangeTrustOptInConfirmation`.
 * Related: `StellarAssetDetailsPage`, `SnapChangeTrustOptInConfirmation`.
 *
 * @see packages/snap ConfirmSignChangeTrustOptOut in snap-stellar-wallet
 */
class SnapChangeTrustOptOutConfirmation {
  private cancelButton = {
    testId: 'confirm-sign-change-trust-opt-out-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-change-trust-opt-out-confirm-snap-footer-button',
    text: 'Confirm',
  };

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private header(assetSymbol: string) {
    return {
      text: `Remove ${assetSymbol} trustline`,
      tag: 'h2',
    };
  }

  /**
   * Waits for the opt-out confirmation UI and an enabled Confirm button
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
      `Check snap change-trust opt-out confirmation is loaded for ${assetSymbol}`,
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
    console.log('Clicking change-trust opt-out confirm');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }
}

export default SnapChangeTrustOptOutConfirmation;
