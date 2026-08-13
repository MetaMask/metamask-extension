import { Driver } from '../../../webdriver/driver';

/**
 * Update-network confirmation when `wallet_addEthereumChain` targets a chain
 * MetaMask already knows.
 *
 * Screen: `#/confirmation` with update-network info (title like
 * "Update {name}"; not a dedicated networks hash route).
 * Owns: approve/cancel footer, approve enabled check, page-loaded by network
 * name, and opening/dismissing warning alerts via inline-alert.
 * Boundaries: adding a brand-new chain is `AddNetworkConfirmation`. Switching
 * the active network is `SwitchNetworkConfirmation`. Alert modal content can
 * also be asserted via `AlertModal`.
 * Related: `AddNetworkConfirmation`, `AlertModal`.
 *
 * @see ui/pages/confirmations/external/add-ethereum-chain/add-ethereum-chain.tsx
 * @see ui/pages/confirmations/confirm/confirm.tsx
 */
class UpdateNetworkConfirmation {
  private readonly alertModalButton = { testId: 'alert-modal-button' };

  private readonly approveButton = { testId: 'confirm-footer-button' };

  private readonly cancelButton = { testId: 'confirm-footer-cancel-button' };

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async approveUpdateNetwork() {
    console.log('Approving update network on confirmation dialog');
    await this.driver.clickElement(this.approveButton);
  }

  async approveUpdateNetworkAndWaitToClose() {
    console.log(
      'Approving update network on confirmation dialog and wait to close',
    );
    await this.driver.clickElementAndWaitForWindowToClose(this.approveButton);
  }

  async cancelUpdateNetwork() {
    console.log('Cancelling update network on confirmation dialog');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  /**
   * Checks if the approve button is enabled on update network confirmation page.
   */
  async checkIsApproveButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.approveButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Approve button not enabled', e);
      return false;
    }
    console.log('Approve button is enabled');
    return true;
  }

  /**
   * @param networkName - The name of the network to update for in the confirmation page
   */
  async checkPageIsLoaded(networkName: string): Promise<void> {
    try {
      await this.driver.waitForSelector({
        text: `Update ${networkName}`,
      });
    } catch (e) {
      console.log(
        `Timeout while waiting for Update network ${networkName} confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Update network ${networkName} confirmation page is loaded`);
  }

  async checkWarningMessageIsDisplayed(key: string, message: string) {
    console.log(
      `Checking if warning message ${message} is displayed on update network confirmation page`,
    );
    await this.driver.clickElement({
      xpath: `//*[@data-testid="inline-alert" and @data-alert-key="${key}"]`,
    });
    await this.driver.waitForSelector({
      text: message,
    });
    await this.driver.clickElementAndWaitToDisappear(this.alertModalButton);
  }
}

export default UpdateNetworkConfirmation;
