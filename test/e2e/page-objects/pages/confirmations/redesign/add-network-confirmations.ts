import { Driver } from '../../../../webdriver/driver';

class AddNetworkConfirmation {
  private readonly driver: Driver;

  private readonly approveButton = { testId: 'confirmation-submit-button' };

  private readonly cancelButton = { testId: 'confirmation-cancel-button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * @param networkName - The name of the network to check for in the confirmation page
   */
  async check_pageIsLoaded(networkName: string): Promise<void> {
    try {
      await this.driver.waitForSelector({
        text: `Add ${networkName}`,
        tag: 'h3',
      });
    } catch (e) {
      console.log(
        `Timeout while waiting for Add network ${networkName} confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Add network ${networkName} confirmation page is loaded`);
  }

  /**
   * Approves the add network on the confirmation dialog.
   *
   * @param windowShouldClose - Whether the window should close after approving the add network.
   */
  async approveAddNetwork(windowShouldClose: boolean = true) {
    console.log('Approving add network on confirmation dialog');
    if (windowShouldClose) {
      await this.driver.clickElementAndWaitForWindowToClose(this.approveButton);
    } else {
      await this.driver.clickElement(this.approveButton);
    }
  }

  async cancelAddNetwork() {
    console.log('Cancelling add network on confirmation dialog');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  /**
   * Checks if the approve button is enabled on add network confirmation page.
   */
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

  async check_warningMessageIsDisplayed(message: string) {
    console.log(
      `Checking if warning message ${message} is displayed on add network confirmation page`,
    );
    await this.driver.waitForSelector({ text: message });
  }
}

export default AddNetworkConfirmation;
