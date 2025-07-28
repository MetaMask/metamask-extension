import { Driver } from '../../../../webdriver/driver';

class SwitchNetworkConfirmation {
  private readonly driver: Driver;

  private readonly approveButton = { testId: 'confirmation-submit-button' };

  private readonly cancelButton = { testId: 'confirmation-cancel-button' };

  private readonly switchNetworkMessage = {
    text: 'Allow this site to switch the network',
    tag: 'h3',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.switchNetworkMessage,
        this.approveButton,
        this.cancelButton,
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for Switch network confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Switch network confirmation page is loaded`);
  }

  async clickApproveSwitchNetwork() {
    console.log('Clicking approve switch network on confirmation dialog');
    await this.driver.clickElement(this.approveButton);
  }

  async clickApproveSwitchNetworkAndWaitToClose() {
    console.log(
      'Clicking approve switch network on confirmation dialog and wait to close',
    );
    await this.driver.clickElementAndWaitForWindowToClose(this.approveButton);
  }

  async clickCancelSwitchNetwork() {
    console.log('Clicking cancel switch network on confirmation dialog');
    await this.driver.clickElement(this.cancelButton);
  }
}

export default SwitchNetworkConfirmation;
