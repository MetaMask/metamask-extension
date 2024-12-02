import { Driver } from '../../../webdriver/driver';

class AssetListPage {
  private readonly driver: Driver;

  private readonly allNetworksOption =
    '[data-testid="network-filter-all__button"]';

  private readonly allNetworksTotal =
    '[data-testid="network-filter-all__total"]';

  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly confirmImportTokenButton =
    '[data-testid="import-tokens-modal-import-button"]';

  private readonly confirmImportTokenMessage = {
    text: 'Would you like to import this token?',
    tag: 'p',
  };

  private readonly currentNetworkOption =
    '[data-testid="network-filter-current__button"]';

  private readonly currentNetworksTotal = `${this.currentNetworkOption} [data-testid="account-value-and-suffix"]`;

  private readonly hideTokenButton = '[data-testid="asset-options__hide"]';

  private readonly hideTokenConfirmationButton =
    '[data-testid="hide-token-confirmation__hide"]';

  private readonly hideTokenConfirmationModalTitle = {
    text: 'Hide token',
    css: '.hide-token-confirmation__title',
  };

  private readonly importTokenModalTitle = { text: 'Import tokens', tag: 'h4' };

  private readonly importTokensButton = '[data-testid="importTokens"]';

  private readonly importTokensNextButton =
    '[data-testid="import-tokens-button-next"]';

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  private readonly tokenAmountValue =
    '[data-testid="multichain-token-list-item-value"]';

  private readonly tokenListItem =
    '[data-testid="multichain-token-list-button"]';

  private readonly tokenOptionsButton = '[data-testid="import-token-button"]';

  private readonly tokenSearchInput = 'input[placeholder="Search tokens"]';

  constructor(driver: Driver) {
    this.driver = driver;
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

  async clickOnAsset(assetName: string): Promise<void> {
    const buttons = await this.driver.findElements(this.tokenListItem);
    for (const button of buttons) {
      const text = await button.getText();
      if (text.includes(assetName)) {
        await button.click();
        return;
      }
    }
    throw new Error(`${assetName} button not found`);
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

  async getNetworksFilterLabel(): Promise<string> {
    console.log(`Retrieving the network filter label`);
    const toggle = await this.driver.findElement(this.networksToggle);
    const text = await toggle.getText();
    return text;
  }

  async getNumberOfAssets(): Promise<number> {
    console.log(`Returning the total number of asset items in the token list`);
    const assets = await this.driver.findElements(this.tokenListItem);
    return assets.length;
  }

  /**
   * Hides a token by clicking on the token name, and confirming the hide modal.
   *
   * @param tokenName - The name of the token to hide.
   */
  async hideToken(tokenName: string): Promise<void> {
    console.log(`Hide token ${tokenName} on homepage`);
    await this.driver.clickElement({ text: tokenName, tag: 'span' });
    await this.driver.clickElement(this.assetOptionsButton);
    await this.driver.clickElement(this.hideTokenButton);
    await this.driver.waitForSelector(this.hideTokenConfirmationModalTitle);
    await this.driver.clickElementAndWaitToDisappear(
      this.hideTokenConfirmationButton,
    );
  }

  async importTokenBySearch(tokenName: string) {
    console.log(`Import token ${tokenName} on homepage by search`);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.fill(this.tokenSearchInput, tokenName);
    await this.driver.clickElement({ text: tokenName, tag: 'p' });
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.waitForSelector(this.confirmImportTokenMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportTokenButton,
    );
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

  async check_ifAssetIsVisible(assetName: string): Promise<boolean> {
    const assets = await this.driver.findElements(this.tokenLisiItem);
    for (const asset of assets) {
      const text = await asset.getText();
      if (text.includes(assetName)) {
        return true;
      }
    }
    return false;
  }

  async check_networkFilterText(expectedText: string): Promise<void> {
    console.log(
      `Verify the displayed account label in header is: ${expectedText}`,
    );
    await this.driver.waitForSelector({
      css: this.networksToggle,
      text: expectedText,
    });
  }

  /**
   * Checks if the specified token amount is displayed in the token list.
   *
   * @param tokenAmount - The token amount to be checked for.
   */
  async check_tokenAmountIsDisplayed(tokenAmount: string): Promise<void> {
    console.log(`Waiting for token amount ${tokenAmount} to be displayed`);
    await this.driver.waitForSelector({
      css: this.tokenAmountValue,
      text: tokenAmount,
    });
  }

  /**
   * Checks if the specified token amount is displayed in the token details modal.
   *
   * @param tokenName - The name of the token to check for.
   * @param tokenAmount - The token amount to be checked for.
   */
  async check_tokenAmountInTokenDetailsModal(
    tokenName: string,
    tokenAmount: string,
  ): Promise<void> {
    console.log(
      `Check that token amount ${tokenAmount} is displayed in token details modal for token ${tokenName}`,
    );
    await this.driver.clickElement({
      tag: 'span',
      text: tokenName,
    });
    await this.driver.waitForSelector({
      css: this.tokenAmountValue,
      text: tokenAmount,
    });
  }

  /**
   * This function checks if the specified number of token items is displayed in the token list.
   *
   * @param expectedNumber - The number of token items expected to be displayed. Defaults to 1.
   * @returns A promise that resolves if the expected number of token items is displayed.
   */
  async check_tokenItemNumber(expectedNumber: number = 1): Promise<void> {
    console.log(`Waiting for ${expectedNumber} token items to be displayed`);
    await this.driver.wait(async () => {
      const tokenItemsNumber = await this.getNumberOfAssets();
      return tokenItemsNumber === expectedNumber;
    }, 10000);
    console.log(
      `Expected number of token items ${expectedNumber} is displayed.`,
    );
  }
}

export default AssetListPage;
