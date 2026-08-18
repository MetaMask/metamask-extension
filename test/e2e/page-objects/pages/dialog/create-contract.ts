import { Driver } from '../../../webdriver/driver';

/**
 * Contract-deployment confirmation dialog (Confirm / Cancel).
 *
 * Screen: notification/dialog window opened when a dapp requests deploying a
 * contract (e.g. test-dapp ERC-20 / ERC-721 deploy).
 * Owns: Confirm and Cancel footer actions and loaded-state wait for those
 * controls.
 * Boundaries: only the deploy confirmation footers. Follow-on token watch /
 * transaction confirmation screens belong to their own confirmation page
 * objects. Does not assert contract-specific info rows.
 * Related: `TransactionConfirmation`, `WatchAssetConfirmation`, hardware-wallet
 * deploy specs under `tests/hardware-wallets/`.
 *
 * @see ui/pages/confirmations/confirm/confirm.tsx
 */
class CreateContractModal {
  private readonly cancelButton = { text: 'Cancel', tag: 'button' };

  private readonly confirmButtton = { text: 'Confirm', tag: 'button' };

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.confirmButtton,
        this.cancelButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for create contract dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Create contract dialog was loaded');
  }

  async clickCancel() {
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async clickConfirm() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButtton);
  }
}

export default CreateContractModal;
