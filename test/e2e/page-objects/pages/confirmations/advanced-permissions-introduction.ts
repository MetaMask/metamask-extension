import { Driver } from '../../../webdriver/driver';

/**
 * Snap-rendered introduction for `wallet_requestExecutionPermissions`.
 *
 * Screen: snap UI confirmation dialog (not a `#/confirmation` redesign
 * route).
 * Owns: cancel via the snap footer button (testid comes from an unnamed snap
 * footer action).
 * Boundaries: connect-account and review-permissions MetaMask pages are
 * `ConnectAccountConfirmation` / `ReviewPermissionsConfirmation`. This
 * object only covers the execution-permissions introduction cancel path.
 * Related: `ConnectAccountConfirmation`, `ReviewPermissionsConfirmation`.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 */
class AdvancedPermissionsIntroduction {
  private readonly cancelButton = {
    // This button isn't explicitly defined in the snap, so doesn't have a nice selector
    testId: 'undefined-snap-footer-button',
  };

  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async cancel(): Promise<void> {
    console.log('Cancel on Advanced Permissions Introduction page');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.cancelButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for Advanced Permissions Introduction page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Advanced Permissions Introduction page is loaded');
  }
}

export default AdvancedPermissionsIntroduction;
