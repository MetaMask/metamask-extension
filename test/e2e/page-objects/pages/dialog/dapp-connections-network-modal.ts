import { Driver } from '../../../webdriver/driver';
import NetworksPage from '../networks/networks-page';

class DappConnectionsNetworkModal {
  private readonly dappAddCustomNetworkButton = {
    tag: 'button',
    text: 'Add a custom network',
  };

  private readonly dappNetworksHeader = {
    tag: 'h4',
    text: 'Manage networks',
  };

  private readonly driver: Driver;

  private readonly networksPage: NetworksPage;

  constructor(driver: Driver) {
    this.driver = driver;
    this.networksPage = new NetworksPage(driver);
  }

  async checkNetworkOptionIsDisplayed(
    networkName: string,
    shouldBeDisplayed: boolean = true,
  ): Promise<void> {
    await this.networksPage.checkNetworkOptionIsDisplayed(
      networkName,
      shouldBeDisplayed,
    );
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

  async toggleShowTestNetwork(): Promise<void> {
    await this.networksPage.toggleShowTestNetwork();
  }
}

export default DappConnectionsNetworkModal;
