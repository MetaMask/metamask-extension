import { Driver } from '../../../webdriver/driver';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';

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

  private readonly customNetworkSelectedOption = (networkName: string) => {
    return {
      css: '.dropdown-editor__item-dropdown',
      text: networkName,
    };
  };

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

  private readonly multichainTokenListButton = {
    testId: 'multichain-token-list-button',
  };

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly sortByAlphabetically =
    '[data-testid="sortByAlphabetically"]';

  private readonly sortByDecliningBalance =
    '[data-testid="sortByDecliningBalance"]';

  private readonly sortByPopoverToggle =
    '[data-testid="sort-by-popover-toggle"]';

  private readonly buySellButton = '[data-testid="coin-overview-buy"]';

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

  private readonly noPriceAvailableMessage = {
    css: 'p',
    text: 'No conversion rate available',
  };

  private readonly modalCloseButton =
    '[data-testid="modal-header-close-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickNetworkSelectorDropdown(): Promise<void> {
    console.log(`Clicking on the network selector dropdown`);
    await this.driver.clickElement(this.sortByPopoverToggle);
  }

  async clickCurrentNetworkOptionOnActivityList(): Promise<void> {
    console.log(`Clicking on the current network option`);
    await this.driver.clickElement(this.currentNetworkOption);
    await this.driver.waitUntil(
      async () => {
        const toggle = await this.driver.findElement(this.sortByPopoverToggle);
        const label = await toggle.getText();
        return label !== 'Popular networks';
      },
      { timeout: 5000, interval: 100 },
    );
  }

  async clickCurrentNetworkOption(): Promise<void> {
    console.log(`Clicking on the current network option`);
    await this.driver.clickElement(this.currentNetworkOption);
    await this.driver.waitUntil(
      async () => {
        const label = await this.getNetworksFilterLabel();
        return label !== 'Popular networks';
      },
      { timeout: 5000, interval: 100 },
    );
  }

  async clickOnAsset(assetName: string): Promise<void> {
    await this.driver.clickElement({
      css: this.tokenListItem,
      text: assetName,
    });
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
    await this.driver.waitForSelector(this.multichainTokenListButton, {
      waitAtLeastGuard: 1000,
    });
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.clickElement(this.tokenChainDropdown);
    await this.driver.clickElementAndWaitToDisappear(
      this.tokenImportSelectNetwork(chainId),
    );
    const networkName =
      NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP];

    if (!networkName) {
      throw new Error(`Network name not found for chain ID ${chainId}`);
    }

    await this.driver.waitForSelector(
      this.customNetworkSelectedOption(networkName),
    );
    await this.driver.waitForSelector(this.tokenSearchInput);
    await this.driver.clickElement(this.customTokenModalOption);
    await this.driver.assertElementNotPresent(this.tokenSearchInput);
    await this.driver.waitForSelector(this.modalWarningBanner);
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
    await this.driver.waitForSelector(this.multichainTokenListButton);
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
    await this.driver.waitForSelector(this.multichainTokenListButton);
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
        return Boolean(await this.driver.findElement(this.modalCloseButton));
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

  async checkBuySellButtonIsPresent(): Promise<void> {
    console.log(`Verify the buy/sell button is displayed`);
    await this.driver.waitForSelector(this.buySellButton);
  }

  async checkMultichainTokenListButtonIsPresent(): Promise<void> {
    console.log(`Verify the multichain-token-list-button is displayed`);
    await this.driver.waitForSelector(this.tokenListItem);
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

  /**
   * Gets the network icon details from the sort-by-networks button
   *
   * @returns Object containing icon src, alt text, and visibility status, or null if no icon found
   */
  async getNetworkIcon(): Promise<{
    src: string;
    alt: string;
    isVisible: boolean;
  } | null> {
    console.log('Getting network icon details from sort-by-networks button');
    const iconDetails = await this.driver.executeScript(`
      const button = document.querySelector('[data-testid="sort-by-networks"]');
      const avatarNetwork = button?.querySelector('.mm-avatar-network img');
      return avatarNetwork ? {
        src: avatarNetwork.src,
        alt: avatarNetwork.alt,
        isVisible: avatarNetwork.offsetWidth > 0 && avatarNetwork.offsetHeight > 0
      } : null;
    `);
    return iconDetails as {
      src: string;
      alt: string;
      isVisible: boolean;
    } | null;
  }

  /**
   * Checks if the network icon is visible in the sort-by-networks button
   *
   * @returns true if icon is present and visible, false otherwise
   */
  async isNetworkIconVisible(): Promise<boolean> {
    console.log('Checking if network icon is visible');
    const iconElement = await this.driver.executeScript(`
      const button = document.querySelector('[data-testid="sort-by-networks"]');
      const avatarNetwork = button?.querySelector('.mm-avatar-network');
      return avatarNetwork ? {
        isPresent: true,
        isVisible: avatarNetwork.offsetWidth > 0 && avatarNetwork.offsetHeight > 0
      } : { isPresent: false, isVisible: false };
    `);

    const result = iconElement as { isPresent: boolean; isVisible: boolean };
    return result.isPresent && result.isVisible;
  }

  /**
   * Verifies that the network icon matches expected characteristics
   *
   * @param expectedIndicators - Array of strings that should be present in the icon URL
   * @throws Error if icon is not found or doesn't match expected characteristics
   */
  async checkNetworkIconContains(expectedIndicators: string[]): Promise<void> {
    console.log(
      `Checking network icon contains one of: ${expectedIndicators.join(', ')}`,
    );

    const iconDetails = await this.getNetworkIcon();

    if (!iconDetails) {
      throw new Error('Network icon not found in sort-by-networks button');
    }

    if (!iconDetails.isVisible) {
      throw new Error('Network icon is not visible');
    }

    const hasValidIcon = expectedIndicators.some((indicator) =>
      iconDetails.src.toLowerCase().includes(indicator.toLowerCase()),
    );

    if (!hasValidIcon) {
      throw new Error(
        `Expected icon to contain one of ${expectedIndicators.join(', ')}, but got: ${iconDetails.src}`,
      );
    }

    console.log(
      `✅ Network icon verification passed - Icon src: ${iconDetails.src}`,
    );
  }

  async checkPriceChartIsShown(): Promise<void> {
    console.log(`Verify the price chart is displayed`);
    await this.driver.waitUntil(
      async () => {
        return await this.driver.isElementPresentAndVisible(this.priceChart);
      },
      { timeout: 2000, interval: 100 },
    );
  }

  async checkPriceChartLoaded(assetAddress: string): Promise<void> {
    console.log(`Verify the price chart is loaded`);
    await this.driver.waitForSelector(this.tokenPercentage(assetAddress));
  }

  /**
   * Checks if the specified token amount is displayed in the token list.
   *
   * @param tokenAmount - The token amount to be checked for.
   */
  async checkTokenAmountIsDisplayed(tokenAmount: string): Promise<void> {
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
  async checkTokenAmountInTokenDetailsModal(
    tokenName: string,
    tokenAmount: string,
  ): Promise<void> {
    console.log(
      `Check that token amount ${tokenAmount} is displayed in token details modal for token ${tokenName}`,
    );
    await this.driver.clickElement({
      testId: 'multichain-token-list-item-token-name',
      text: tokenName,
    });
    await this.driver.waitForSelector({
      css: this.tokenAmountValue,
      text: tokenAmount,
    });
  }

  async checkTokenFiatAmountIsDisplayed(
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
  async checkTokenExistsInList(
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
      await this.checkTokenAmountIsDisplayed(amount);
    }
  }

  /**
   * This function checks if the specified number of token items is displayed in the token list.
   *
   * @param expectedNumber - The number of token items expected to be displayed. Defaults to 1.
   * @returns A promise that resolves if the expected number of token items is displayed.
   */
  async checkTokenItemNumber(expectedNumber: number = 1): Promise<void> {
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
  async checkTokenGeneralChangePercentage(
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
  async checkTokenGeneralChangePercentageNotPresent(
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
  async checkTokenGeneralChangeValue(
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
  async checkTokenPriceAndMarketCap(
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

  async checkTokenPrice(expectedPrice: string): Promise<void> {
    console.log(`Verifying token price ${expectedPrice}`);
    await this.driver.waitForSelector({
      css: this.assetPriceInDetailsModal,
      text: expectedPrice,
    });
  }

  /**
   * Verifies the token details in the token details modal
   *
   * @param symbol - The expected token symbol/name
   * @param tokenAddress - The expected token address
   * @throws Error if the token details don't match the expected values
   */
  async checkTokenSymbolAndAddressDetails(
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

  /**
   * Checks if the token list is displayed
   *
   * @throws Error if the token list is not displayed
   */
  async checkTokenListIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.tokenListItem, {
        timeout: 300000,
      });
    } catch (e) {
      console.log('Token list is not displayed', e);
      throw e;
    }
  }

  /**
   * Waits for a token to be displayed in the token list
   * This is done due to the snap delay.
   *
   * @param tokenName - The name of the token to wait for
   */
  async waitForTokenToBeDisplayed(tokenName: string): Promise<void> {
    await this.driver.waitForSelector(
      {
        css: this.tokenListItem,
        text: tokenName,
      },
      { timeout: 30000 },
    );
  }

  /**
   * Checks if the token list prices are displayed and no "No conversion rate available" message is displayed
   *
   * @throws Error if a "No conversion rate available" message is displayed
   */
  async checkConversionRateDisplayed(): Promise<void> {
    await this.driver.assertElementNotPresent(this.noPriceAvailableMessage);
  }
}

export default AssetListPage;
