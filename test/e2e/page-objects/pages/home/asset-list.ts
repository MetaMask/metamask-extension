import { Driver } from '../../../webdriver/driver';

class AssetListPage {
  private readonly driver: Driver;

  private readonly allNetworksOption =
    '[data-testid="network-filter-all__button"]';

  private readonly allNetworksTotal =
    '[data-testid="network-filter-all__total"]';

  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly assetPriceInDetailsModal =
    '[data-testid="asset-hovered-price"]';

  private readonly assetMarketCapInDetailsModal =
    '[data-testid="asset-market-cap"]';

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

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly sortByAlphabetically =
    '[data-testid="sortByAlphabetically"]';

  private readonly sortByDecliningBalance =
    '[data-testid="sortByDecliningBalance"]';

  private readonly sortByPopoverToggle =
    '[data-testid="sort-by-popover-toggle"]';

  private readonly tokenFiatAmount =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  private readonly sendButton = '[data-testid="eth-overview-send"]';

  private readonly tokenAddressInput =
    '[data-testid="import-tokens-modal-custom-address"]';

  private readonly tokenAmountValue =
    '[data-testid="multichain-token-list-item-value"]';

  private readonly tokenImportedSuccessMessage = {
    text: 'Token imported',
    tag: 'h6',
  };

  private readonly tokenAddressInDetails =
    '[data-testid="address-copy-button-text"]';

  private readonly tokenConfirmListItem =
    '.import-tokens-modal__confirm-token-list-item-wrapper';

  private readonly tokenDecimalsTitle = {
    css: '.mm-label',
    text: 'Token decimal',
  };

  private readonly tokenNameInDetails = '[data-testid="asset-name"]';

  private readonly tokenImportedMessageCloseButton =
    '.actionable-message__message button[aria-label="Close"]';

  private readonly tokenListItem =
    '[data-testid="multichain-token-list-button"]';

  private readonly tokenOptionsButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private readonly tokenSymbolTitle = {
    css: '.mm-label',
    text: 'Token symbol',
  };

  private tokenImportSelectNetwork(chainId: string): string {
    return `[data-testid="select-network-item-${chainId}"]`;
  }

  private tokenPercentage(address: string): string {
    return `[data-testid="token-increase-decrease-percentage-${address}"]`;
  }

  private readonly tokenChainDropdown =
    '[data-testid="test-import-tokens-drop-down-custom-import"]';

  private readonly tokenSearchInput = 'input[placeholder="Search tokens"]';

  private readonly tokenSymbolInput =
    '[data-testid="import-tokens-modal-custom-symbol"]';

  private readonly modalWarningBanner = '[data-testid="custom-token-warning"]';

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

  async clickSendButton(): Promise<void> {
    console.log(`Clicking on the send button`);
    await this.driver.clickElement(this.sendButton);
  }

  /**
   * Dismisses the "Token imported" success message by clicking the close button
   */
  async dismissTokenImportedMessage(): Promise<void> {
    console.log('Dismissing token imported success message');
    await this.driver.clickElement(this.tokenImportedMessageCloseButton);
    await this.driver.assertElementNotPresent(this.tokenImportedSuccessMessage);
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

  async importCustomTokenByChain(
    chainId: string,
    tokenAddress: string,
    symbol?: string,
  ): Promise<void> {
    console.log(`Creating custom token ${symbol} on homepage`);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.clickElement(this.customTokenModalOption);
    await this.driver.waitForSelector(this.modalWarningBanner);
    await this.driver.clickElement(this.tokenChainDropdown);
    await this.driver.clickElementAndWaitToDisappear(
      this.tokenImportSelectNetwork(chainId),
    );
    await this.driver.fill(this.tokenAddressInput, tokenAddress);
    await this.driver.waitForSelector(this.tokenSymbolTitle);

    if (symbol) {
      // do not fill the form until the button is disabled, because there's a form re-render which can clear the input field causing flakiness
      await this.driver.waitForSelector(this.importTokensNextButton, {
        state: 'disabled',
        waitAtLeastGuard: 1000,
      });
      await this.driver.fill(this.tokenSymbolInput, symbol);
    }

    await this.driver.waitForSelector(this.tokenDecimalsTitle);
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.waitForSelector(this.tokenConfirmListItem);
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
      await this.driver.waitForElementToStopMoving({ text: name, tag: 'p' });
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
        return Boolean(await this.driver.findElement(this.allNetworksOption));
      },
      {
        timeout: 5000,
        interval: 100,
      },
    );
  }

  /**
   * Opens the token details modal by finding and clicking the token in the token list
   *
   * @param tokenSymbol - The name of the token to open details for
   * @throws Error if the token with the specified name is not found
   */
  async openTokenDetails(tokenSymbol: string): Promise<void> {
    console.log(`Opening token details for ${tokenSymbol}`);
    const tokenElements = await this.driver.findElements(this.tokenListItem);

    for (const element of tokenElements) {
      const text = await element.getText();
      if (text.includes(tokenSymbol)) {
        await element.click();
        return;
      }
    }
    throw new Error(`Token "${tokenSymbol}" not found in token list`);
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

  async check_priceChartIsShown(): Promise<void> {
    console.log(`Verify the price chart is displayed`);
    await this.driver.waitUntil(
      async () => {
        return await this.driver.isElementPresentAndVisible(this.priceChart);
      },
      { timeout: 2000, interval: 100 },
    );
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
    console.log(`Token amount ${tokenAmount} was found`);
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

  async check_tokenFiatAmountIsDisplayed(
    tokenFiatAmount: string,
  ): Promise<void> {
    console.log(
      `Waiting for token fiat amount ${tokenFiatAmount} to be displayed`,
    );
    await this.driver.waitForSelector({
      css: this.tokenFiatAmount,
      text: tokenFiatAmount,
    });
  }

  /**
   * Checks if a token exists in the token list and optionally verifies the token amount.
   *
   * @param tokenName - The name of the token to check in the list.
   * @param amount - (Optional) The amount of the token to verify if it is displayed.
   * @returns A promise that resolves if the token exists and the amount is displayed (if provided), otherwise it throws an error.
   * @throws Will throw an error if the token is not found in the token list.
   */
  async check_tokenExistsInList(
    tokenName: string,
    amount?: string,
  ): Promise<void> {
    console.log(`Checking if token ${tokenName} exists in token list`);
    const tokenList = await this.getTokenListNames();
    const isTokenPresent = tokenList.some((token) => token.includes(tokenName));
    if (!isTokenPresent) {
      throw new Error(`Token "${tokenName}" was not found in the token list`);
    }

    console.log(`Token "${tokenName}" was found in the token list`);

    if (amount) {
      await this.check_tokenAmountIsDisplayed(amount);
    }
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
    try {
      console.log(
        `Checking token general change percentage for address ${address}`,
      );
      await this.driver.waitForSelector({
        css: this.tokenPercentage(address),
        text: expectedChange,
      });
    } catch (error) {
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
    try {
      console.log(`Checking token general change value ${expectedChangeValue}`);
      await this.driver.waitForSelector({
        css: this.tokenIncreaseDecreaseValue,
        text: expectedChangeValue,
      });
      console.log(
        `Token general change value ${expectedChangeValue} was found`,
      );
    } catch (error) {
      throw new Error(
        `Token general change value ${expectedChangeValue} not found`,
      );
    }
  }

  /**
   * Verifies the token price and market cap in the token details modal
   *
   * @param expectedPrice - The expected token price (e.g. "$1,234.56")
   * @param expectedMarketCap - The expected market cap (e.g. "$1.23.00")
   * @throws Error if the price or market cap don't match the expected values
   */
  async check_tokenPriceAndMarketCap(
    expectedPrice: string,
    expectedMarketCap: string,
  ): Promise<void> {
    console.log(`Verifying token price and market cap`);

    await this.driver.waitForSelector({
      css: this.assetPriceInDetailsModal,
      text: expectedPrice,
    });

    await this.driver.waitForSelector({
      css: this.assetMarketCapInDetailsModal,
      text: expectedMarketCap,
    });

    console.log(`Token price and market cap verified successfully`);
  }

  /**
   * Verifies the token details in the token details modal
   *
   * @param symbol - The expected token symbol/name
   * @param tokenAddress - The expected token address
   * @throws Error if the token details don't match the expected values
   */
  async check_tokenSymbolAndAddressDetails(
    symbol: string,
    tokenAddress: string,
  ): Promise<void> {
    console.log(`Verifying token details for ${symbol}`);

    await this.driver.waitForSelector({
      css: this.tokenNameInDetails,
      text: symbol,
    });

    const expectedAddressFormat = `${tokenAddress.slice(
      0,
      7,
    )}...${tokenAddress.slice(37)}`;

    await this.driver.waitForSelector({
      css: this.tokenAddressInDetails,
      text: expectedAddressFormat,
    });
    console.log(`Token details verified successfully for ${symbol}`);
  }
}

export default AssetListPage;
