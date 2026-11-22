import { Driver } from '../../../webdriver/driver';

/**
 * Alert modal for pending confirmations when adding/switching networks.
 *
 * Screen: alert modal layered over an add/switch Ethereum chain confirmation
 * when other pending confirmations exist from the same origin (action key
 * `showPendingConfirmation`).
 * Owns: "Got it" dismiss and "Review pending transactions" /
 * show-pending-confirmation action.
 * Boundaries: stops at this alert modal. The parent add/switch confirmation
 * belongs to `NetworkSwitchModalConfirmation` / `SwitchNetworkConfirmation`.
 * Signature/tx confirm-alert acknowledge belongs to `ConfirmAlertModal`.
 * Related: `NetworkSwitchModalConfirmation`, `SwitchNetworkConfirmation`,
 * `ConfirmAlertModal`; alert content is produced by
 * `useUpdateEthereumChainAlerts`.
 *
 * @see ui/components/app/alert-system/alert-modal/alert-modal.tsx
 */
class NetworkSwitchAlertModal {
  driver: Driver;

  private readonly gotItButton = '[data-testid="alert-modal-button"]';

  private readonly showPendingConfirmationButton =
    '[data-testid="alert-modal-action-showPendingConfirmation"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.gotItButton,
        this.showPendingConfirmationButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Network switch alert modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Network switch alert modal is loaded');
  }

  async clickGotItButton(): Promise<void> {
    console.log('Click got it button and wait for window to close');
    await this.driver.clickElementAndWaitForWindowToClose(this.gotItButton);
  }

  async clickShowPendingConfirmationButton(): Promise<void> {
    console.log('Click show pending confirmation button');
    await this.driver.clickElementAndWaitToDisappear(
      this.showPendingConfirmationButton,
    );
  }
}

export default NetworkSwitchAlertModal;
