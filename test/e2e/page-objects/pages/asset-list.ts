import { Driver } from '../../webdriver/driver';

class AssetListPage {
  private readonly driver: Driver;

  // Selectors
  private readonly networksToggle = '[data-testid="sort-by-networks"]';
  private readonly allNetworksOption =
    '[data-testid="network-filter-all__button"]';
  private readonly currentNetworkOption =
    '[data-testid="network-filter-current__button"]';
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

  async getAllNetworksOptionTotal(): Promise<string> {
    console.log(`Retrieving the "All networks" option fiat value`);
    const allNetworksValueElement = await this.driver.findElement(
      this.allNetworksTotal,
    );
    const value = await allNetworksValueElement.getText();
    return value;
  }

  async getCurrentNetworksOptionTotal(): Promise<string> {
    console.log(`Retrieving the "Current network" option fiat value`);
    const allNetworksValueElement = await this.driver.findElement(
      this.currentNetworksTotal,
    );
    const value = await allNetworksValueElement.getText();
    return value;
  }

  async selectNetworkFilterAllNetworks(): Promise<void> {
    console.log(`Selecting "All networks" from the network filter`);
    await this.driver.clickElement(this.allNetworksOption);

    // TODO: Replace this with polling for text to say "All networks"
    await this.driver.delay(2000);
  }

  async selectNetworkFilterCurrentNetwork(): Promise<void> {
    console.log(`Selecting "Current network" from the network filter`);
    await this.driver.clickElement(this.currentNetworkOption);

    // TODO: Replace this with polling for text to *not* say "All networks"
    // Don't check for specific network name as it could change based on global network chosen
    await this.driver.delay(2000);
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
