import { Driver } from '../../../webdriver/driver';
import SelectNetwork from './select-network';

class DappConnectionsNetworkModal {
  private readonly driver: Driver;

  private readonly selectNetwork: SelectNetwork;

  private readonly dappAddCustomNetworkButton = {
    tag: 'button',
    text: 'Add a custom network',
  };

  private readonly dappNetworksHeader = {
    tag: 'h4',
    text: 'Manage networks',
  };

  constructor(driver: Driver) {
    this.driver = driver;
    this.selectNetwork = new SelectNetwork(driver);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.dappNetworksHeader,
        this.dappAddCustomNetworkButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for dapp connections network modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Dapp connections network modal is loaded');
  }

  async checkNetworkOptionIsDisplayed(
    networkName: string,
    shouldBeDisplayed: boolean = true,
  ): Promise<void> {
    await this.selectNetwork.checkNetworkOptionIsDisplayed(
      networkName,
      shouldBeDisplayed,
    );
  }

  async toggleShowTestNetwork(): Promise<void> {
    await this.selectNetwork.toggleShowTestNetwork();
  }
}

export default DappConnectionsNetworkModal;
