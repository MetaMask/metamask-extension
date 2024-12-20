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

  private readonly customTokenModalOption = {
    text: 'Custom token',
    tag: 'button',
  };

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

  private sortByAlphabetically = '[data-testid="sortByAlphabetically"]';

  private sortByDecliningBalance = '[data-testid="sortByDecliningBalance"]';

  private sortByPopoverToggle = '[data-testid="sort-by-popover-toggle"]';

  private readonly tokenAddressInput =
    '[data-testid="import-tokens-modal-custom-address"]';

  private readonly tokenAmountValue =
    '[data-testid="multichain-token-list-item-value"]';

  private readonly tokenImportedSuccessMessage = {
    text: 'Token imported',
    tag: 'h6',
  };

  private readonly tokenListItem =
    '[data-testid="multichain-token-list-button"]';

  private readonly tokenOptionsButton = '[data-testid="import-token-button"]';

  private tokenPercentage(address: string): string {
    return `[data-testid="token-increase-decrease-percentage-${address}"]`;
  }

  private readonly tokenSearchInput = 'input[placeholder="Search tokens"]';

  private readonly tokenSymbolInput =
    '[data-testid="import-tokens-modal-custom-symbol"]';

  private readonly modalWarningBanner = 'div.mm-banner-alert--severity-warning';

  private readonly tokenIncreaseDecreaseValue =
    '[data-testid="token-increase-decrease-value"]';

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

  async getTokenListNames(): Promise<string[]> {
    console.log(`Retrieving the list of token names`);
    const tokenElements = await this.driver.findElements(this.tokenListItem);
    const tokenNames = await Promise.all(
      tokenElements.map(async (element) => {
        return await element.getText();
      }),
    );
    return tokenNames;
  }

  async getAssetPercentageIncreaseDecrease(
    assetAddress: string,
  ): Promise<string> {
    console.log(
      `Retrieving the percentage increase or decrease for ${assetAddress}`,
    );
    const percentageElement = await this.driver.findElement(
      this.tokenPercentage(assetAddress),
    );
    const percentage = await percentageElement.getText();
    return percentage;
  }

  async sortTokenList(
    sortBy: 'alphabetically' | 'decliningBalance',
  ): Promise<void> {
    console.log(`Sorting the token list by ${sortBy}`);
    await this.driver.clickElement(this.sortByPopoverToggle);
    if (sortBy === 'alphabetically') {
      await this.driver.clickElement(this.sortByAlphabetically);
    } else if (sortBy === 'decliningBalance') {
      await this.driver.clickElement(this.sortByDecliningBalance);
    }
  }

  /**
   * Hides a token by clicking on the token name, and confirming the hide modal.
   *
   * @param tokenName - The name of the token to hide.
   */
  async hideToken(tokenName: string): Promise<void> {
    console.log(`Hide token ${tokenName} on homepage`);
    await this.driver.clickElement({ text: tokenName, tag: 'p' });
    await this.driver.clickElement(this.assetOptionsButton);
    await this.driver.clickElement(this.hideTokenButton);
    await this.driver.waitForSelector(this.hideTokenConfirmationModalTitle);
    await this.driver.clickElementAndWaitToDisappear(
      this.hideTokenConfirmationButton,
    );
  }

  async importCustomToken(tokenAddress: string, symbol: string): Promise<void> {
    console.log(`Creating custom token ${symbol} on homepage`);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.clickElement(this.customTokenModalOption);
    await this.driver.waitForSelector(this.modalWarningBanner);
    await this.driver.fill(this.tokenAddressInput, tokenAddress);
    await this.driver.fill(this.tokenSymbolInput, symbol);
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportTokenButton,
    );
    await this.driver.waitForSelector(this.tokenImportedSuccessMessage);
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

  async importMultipleTokensBySearch(tokenNames: string[]) {
    console.log(
      `Importing tokens ${tokenNames.join(', ')} on homepage by search`,
    );
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);

    for (const name of tokenNames) {
      await this.driver.fill(this.tokenSearchInput, name);
      await this.driver.clickElement({ text: name, tag: 'p' });
    }
    await this.driver.clickElement(this.importTokensNextButton);
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
   * This function checks if the specified token is displayed in the token list by its name.
   *
   * @param tokenName - The name of the token to check for.
   * @returns A promise that resolves if the specified token is displayed.
   */
  async check_tokenIsDisplayed(tokenName: string): Promise<void> {
    console.log(`Waiting for token ${tokenName} to be displayed`);
    await this.driver.waitForSelector({
      text: tokenName,
      tag: 'p',
    });
    console.log(`Token ${tokenName} is displayed.`);
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

  /**
   * Checks if the token's general increase or decrease percentage is displayed correctly
   *
   * @param address - The token address to check
   * @param expectedChange - The expected change percentage value (e.g. '+0.02%' or '-0.03%')
   */
  async check_tokenGeneralChangePercentage(
    address: string,
    expectedChange: string,
  ): Promise<void> {
    console.log(
      `Checking token general change percentage for address ${address}`,
    );
    const isPresent = await this.driver.isElementPresentAndVisible({
      css: this.tokenPercentage(address),
      text: expectedChange,
    });
    if (!isPresent) {
      throw new Error(
        `Token general change percentage ${expectedChange} not found for address ${address}`,
      );
    }
  }

    /**
   * Checks if the token's percentage change element does not exist
   *
   * @param address - The token address to check
   */
    async check_tokenGeneralChangePercentageNotPresent(
      address: string,
    ): Promise<void> {
      console.log(
        `Checking token general change percentage is not present for address ${address}`,
      );
      const isPresent = await this.driver.isElementPresent({
        css: this.tokenPercentage(address),
      });
      if (isPresent) {
        throw new Error(
          `Token general change percentage element should not exist for address ${address}`,
        );
      }
    }

  /**
   * Checks if the token's general increase or decrease value is displayed correctly
   *
   * @param expectedChangeValue - The expected change value (e.g. '+$50.00' or '-$30.00')
   */
  async check_tokenGeneralChangeValue(
    expectedChangeValue: string,
  ): Promise<void> {
    console.log(`Checking token general change value ${expectedChangeValue}`);
    const isPresent = await this.driver.isElementPresentAndVisible({
      css: this.tokenIncreaseDecreaseValue,
      text: expectedChangeValue,
    });
    if (!isPresent) {
      throw new Error(
        `Token general change value ${expectedChangeValue} not found`,
      );
    }
  }
}

export default AssetListPage;
