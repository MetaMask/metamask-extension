import { Driver } from '../../../../webdriver/driver';

class ConnectConfirmation {
  private driver: Driver;

  private readonly confirmConnectButton = '[data-testid="confirm-btn"]';

  private readonly connectDialogTitle = {
    tag: 'h2',
    text: 'Connect with MetaMask',
  };

  private readonly editNetworksTitle = {
    tag: 'h4',
    text: 'Edit networks',
  };

  private readonly editButton = '[data-testid="edit"]';

  private readonly updateNetworkButton =
    '[data-testid="connect-more-chains-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.connectDialogTitle,
        this.confirmConnectButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Connect Confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Connect Confirmation page is loaded');
  }

  /**
   * Edit network in connect confirmation dialog and confirm connect
   *
   * @param networkName - Network name to check the network checkbox
   */
  async editNetworkAndConfirmConnect(networkName: string) {
    console.log(
      'Edit network in connect confirmation dialog and confirm connect',
    );
    const editButtons = await this.driver.findElements(this.editButton);
    await editButtons[1].click();
    await this.driver.waitForSelector(this.editNetworksTitle);
    await this.driver.clickElement({
      text: networkName,
      tag: 'p',
    });
    await this.driver.clickElement(this.updateNetworkButton);
    await this.driver.waitForSelector(this.connectDialogTitle);
    await this.driver.clickElementAndWaitToDisappear(this.confirmConnectButton);
  }
}

export default ConnectConfirmation;
