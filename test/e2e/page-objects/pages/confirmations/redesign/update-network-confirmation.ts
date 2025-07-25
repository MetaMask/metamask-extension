import { Driver } from '../../../../webdriver/driver';

class UpdateNetworkConfirmation {
  private readonly driver: Driver;

  private readonly approveButton = { testId: 'confirmation-submit-button' };

  private readonly cancelButton = { testId: 'confirmation-cancel-button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * @param networkName - The name of the network to update for in the confirmation page
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(networkName: string): Promise<void> {
    try {
      await this.driver.waitForSelector({
        text: `Update ${networkName}`,
        tag: 'h3',
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_isApproveButtonEnabled(): Promise<boolean> {
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_warningMessageIsDisplayed(message: string) {
    console.log(
      `Checking if warning message ${message} is displayed on update network confirmation page`,
    );
    await this.driver.waitForSelector({ text: message });
  }
}

export default UpdateNetworkConfirmation;
