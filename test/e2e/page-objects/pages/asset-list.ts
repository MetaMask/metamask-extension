import { Driver } from '../../webdriver/driver';

class AssetListPage {
  private readonly driver: Driver;

  private readonly allNetworksOption =
    '[data-testid="network-filter-all__button"]';

  private readonly currentNetworkOption =
    '[data-testid="network-filter-current__button"]';

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  private readonly allNetworksTotal =
    '[data-testid="network-filter-all__total"]';

  private readonly currentNetworksTotal = `${this.currentNetworkOption} [data-testid="account-value-and-suffix"]`;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkFilterText(expectedText: string): Promise<void> {
    console.log(
      `Verify the displayed account label in header is: ${expectedText}`,
    );
    await this.driver.waitForSelector({
      css: this.networksToggle,
      text: expectedText,
    });
  }

  async openNetworksFilter(): Promise<void> {
    console.log(`Opening the network filter`);
    await this.driver.clickElement(this.networksToggle);
    await this.driver.waitUntil(
      async () => {
        return await this.driver.findElement(this.allNetworksOption);
      },
      {
        timeout: 5000,
        interval: 100,
      },
    );
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

    await this.driver.waitUntil(
      async () => {
        const label = await this.getNetworksFilterLabel();
        return label !== 'All networks';
      },
      { timeout: 5000, interval: 100 },
    );
  }

  async waitUntilAssetListHasItems(expectedItemsCount: number): Promise<void> {
    console.log(`Waiting until the asset list has ${expectedItemsCount} items`);
    await this.driver.waitUntil(
      async () => {
        const items = await this.getNumberOfAssets();
        return items === expectedItemsCount;
      },
      { timeout: 5000, interval: 100 },
    );
  }

  async waitUntilFilterLabelIs(label: string): Promise<void> {
    console.log(`Waiting until the filter label is ${label}`);
    await this.driver.waitUntil(
      async () => {
        const currentLabel = await this.getNetworksFilterLabel();
        return currentLabel === label;
      },
      { timeout: 5000, interval: 100 },
    );
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

  async selectNetworkFilterAllNetworks(): Promise<void> {
    console.log(`Selecting "All networks" from the network filter`);
    await this.driver.clickElement(this.allNetworksOption);

    await this.driver.waitUntil(
      async () => {
        const label = await this.getNetworksFilterLabel();
        return label === 'All networks';
      },
      { timeout: 5000, interval: 100 },
    );
  }

  async selectNetworkFilterCurrentNetwork(): Promise<void> {
    console.log(`Selecting "Current network" from the network filter`);
    await this.driver.clickElement(this.currentNetworkOption);

    await this.driver.waitUntil(
      async () => {
        const label = await this.getNetworksFilterLabel();
        return label !== 'All networks';
      },
      { timeout: 5000, interval: 100 },
    );
  }

  async getNumberOfAssets(): Promise<number> {
    console.log(`Returning the total number of asset items in the token list`);
    const assets = await this.driver.findElements(
      '.multichain-token-list-item',
    );
    return assets.length;
  }

  // Added method to check if an asset is visible
  async isAssetVisible(assetName: string): Promise<boolean> {
    const assets = await this.driver.findElements(
      '[data-testid="multichain-token-list-button"]',
    );
    for (const asset of assets) {
      const text = await asset.getText();
      if (text.includes(assetName)) {
        return true;
      }
    }
    return false;
  }
}

export default AssetListPage;
