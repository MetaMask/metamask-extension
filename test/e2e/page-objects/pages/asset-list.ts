import { Driver } from '../../webdriver/driver';

class AssetListPage {
  private readonly driver: Driver;

  // Selectors

  private readonly networksToggle = '[data-testid="network-filter"]';

  private readonly allNetworksOption = '[data-testid="all-networks__button"]';

  private readonly currentNetworkOption =
    '[data-testid="current-network__button"]';

  private readonly allNetworksTotal =
    '[data-testid="network-filter-all__total"]';

  private readonly currentNetworksTotal = `${this.currentNetworkOption} [data-testid="account-value-and-suffix"]`;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openNetworksFilter(): Promise<void> {
    console.log(`Opening the network filter`);
    await this.driver.clickElement(this.networksToggle);
  }

  async getNetworksFilterLabel(): Promise<string> {
    console.log(`Retrieving the network filter label`);
    const toggle = await this.driver.findElement(this.networksToggle);
    const text = await toggle.getText();
    return text;
  }

  async clickCurrentNetworkOption(): Promise<void> {
    console.log(`Clicking on the current network option`);
    await this.driver.clickElement(this.currentNetworkOption);
  }

  async getAllNetworksOptionTotal(): Promise<string> {
    console.log(`Retrieving the "All networks" option fiat value`);
    const allNetworksValueElement = await this.driver.findElement(
      this.allNetworksTotal,
    );
    const value = await allNetworksValueElement.getText();
    return value;
  }

  async clickOnAsset(assetName: string): Promise<void> {
    const buttons = await this.driver.findElements(
      '[data-testid="multichain-token-list-button"]',
    );

    for (const button of buttons) {
      const text = await button.getText();
      if (text.includes(assetName)) {
        await button.click();
        return;
      }
    }

    throw new Error(`${assetName} button not found`);
  }

  async getCurrentNetworksOptionTotal(): Promise<string> {
    console.log(`Retrieving the "Current network" option fiat value`);
    const allNetworksValueElement = await this.driver.findElement(
      this.currentNetworksTotal,
    );
    const value = await allNetworksValueElement.getText();
    return value;
  }

  async getNumberOfAssets(): Promise<number> {
    console.log(`Returning the total number of asset items in the token list`);
    const assets = await this.driver.findElements(
      '.multichain-token-list-item',
    );
    return assets.length;
  }
}

export default AssetListPage;
