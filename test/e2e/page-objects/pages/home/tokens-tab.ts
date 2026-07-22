import NetworkManager from '../network-manager';
import HomePage from './homepage';

const SEARCH_TOKEN_ASSET_IDS: Record<string, string> = {
  BAT: 'eip155:56/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  CHAI: 'eip155:1/erc20:0x06af07097c9eeb7fd685c692751d5c66db49c215',
  CHAIN: 'eip155:1/erc20:0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
  CHANGE: 'eip155:1/erc20:0x7051faed0775f664a0286af4f75ef5ed74e02754',
  DAI: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
  'MUSICAL TOKEN': 'eip155:1/erc20:0x0994206dfe8de6ec6920ff4d779b0d950605fb53',
  MUSD: 'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
};

class TokensTab extends HomePage {
  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly assetPriceInDetailsModal =
    '[data-testid="asset-hovered-price"]';

  private readonly assetMarketCapInDetailsModal =
    '[data-testid="asset-market-cap"]';

  private readonly currentNetworkOption =
    '[data-testid="network-filter-current__button"]';

  private readonly currentNetworksTotal = `${this.currentNetworkOption} [data-testid="account-value-and-suffix"]`;

  private readonly customTokenImportAddressInput =
    '[data-testid="custom-token-import-address-input"]';

  private readonly customTokenImportDecimalInput =
    '[data-testid="custom-token-import-decimal-input"]';

  private readonly customTokenImportNetworkSelector =
    '[data-testid="network-selector"]';

  private readonly customTokenImportPage =
    '[data-testid="custom-token-import-page"]';

  private readonly customTokenImportSubmitButton =
    '[data-testid="custom-token-import-submit-button"]';

  private readonly customTokenImportSymbolInput =
    '[data-testid="custom-token-import-symbol-input"]';

  private readonly hideTokenButton = '[data-testid="asset-options__hide"]';

  private readonly hideTokenConfirmationButton =
    '[data-testid="hide-token-confirmation__hide"]';

  private readonly hideTokenConfirmationModalTitle = {
    text: 'Hide token',
    css: '.hide-token-confirmation__title',
  };

  private readonly manageTokensButton = '[data-testid="manageTokens__button"]';

  private readonly lowValueAssetsToggle =
    '[data-testid="low-value-assets-toggle"]';

  private readonly lowValueAssetsToggleExpanded = `${this.lowValueAssetsToggle}[aria-expanded="true"]`;

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

  private readonly coinOverviewBuyButton = '[data-testid="coin-overview-buy"]';

  private readonly coinOverviewSendButton =
    '[data-testid="coin-overview-send"]';

  private readonly coinOverviewSwapButton =
    '[data-testid="coin-overview-swap"]';

  private readonly tokenFiatAmount =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  private readonly tokenAmountValue =
    '[data-testid="multichain-token-list-item-value"]';

  private readonly tokenImportedSuccessMessage = {
    text: 'Token imported',
    tag: 'h6',
  };

  private readonly tokenAddressInDetails =
    '[data-testid="address-copy-button-text"]';

  private readonly tokenNameInDetails =
    '[data-testid="multichain-token-list-item-token-name"]';

  private readonly tokenImportedMessageCloseButton =
    '.home__new-tokens-imported-notification button[aria-label="Close"]';

  private readonly tokenListItem =
    '[data-testid="multichain-token-list-button"]';

  private readonly tokenOptionsButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private tokenPercentage(address: string): string {
    return `[data-testid="token-increase-decrease-percentage-${address}"]`;
  }

  private tokenManagementSearchToggleControl(tokenName: string): string {
    const assetId = SEARCH_TOKEN_ASSET_IDS[tokenName.toUpperCase()];

    if (!assetId) {
      throw new Error(
        `No e2e token-management search asset ID for ${tokenName}`,
      );
    }

    return `[data-testid="token-management-cell-search-${assetId.toLowerCase()}-toggle-control"]`;
  }

  private readonly tokenManagementAddCustomTokenButton =
    '[data-testid="token-management-add-custom-token-button"]';

  private readonly tokenManagementBackButton =
    '[data-testid="token-management-header-back-button"]';

  private readonly tokenManagementCustomTokenSuccessToast =
    '[data-testid="token-management-custom-token-success-toast"]';

  private readonly tokenManagementPage =
    '[data-testid="token-management-page"]';

  private readonly tokenManagementSearchInput =
    '[data-testid="token-management-search-input"]';

  private readonly tokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  private readonly tokenIncreaseDecreaseValue =
    '[data-testid="token-increase-decrease-value"]';

  private readonly noPriceAvailableMessage = {
    css: '[data-testid="multichain-token-list-item-secondary-value"]',
    text: '—',
  };

  private readonly modalCloseButton =
    '[data-testid="modal-header-close-button"]';

  private readonly refreshErc20Tokens = {
    testId: 'refreshList',
  };

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
    console.log(`Clicking on the token name `);
    await this.expandLowValueAssetsIfPresent();
    await this.driver.clickElement({
      css: this.tokenListItem,
      text: assetName,
    });
  }

  async clickMultichainTokenListButton(): Promise<void> {
    console.log('Clicking on multichain token list button');
    await this.driver.clickElement(this.multichainTokenListButton);
  }

  /**
   * Dismisses the "Token imported" success message by clicking the close button
   */
  async dismissTokenImportedMessage(): Promise<void> {
    console.log('Dismissing token imported success message');
    await this.driver.clickElementSafe(this.tokenImportedMessageCloseButton);
    await this.driver.assertElementNotPresent(this.tokenImportedSuccessMessage);
  }

  private async returnFromTokenManagementToHome(): Promise<void> {
    await this.driver.clickElement(this.tokenManagementBackButton);
    await this.driver.waitForSelector(this.multichainTokenListButton);
  }

  private async expandLowValueAssetsIfPresent(): Promise<void> {
    // If the low value assets section is already expanded, no action is required.
    try {
      await this.driver.waitForSelector(this.lowValueAssetsToggleExpanded, {
        timeout: 1000,
      });
      return;
    } catch {
      // Not expanded yet (or low value section not present), attempt to expand it below.
    }

    await this.driver.clickElementSafe(this.lowValueAssetsToggle);
  }

  private async clickTokenManagementToggle(toggleControlSelector: string) {
    await this.driver.clickElementSafe(
      `${toggleControlSelector} .toggle-button--off`,
    );
    await this.driver.waitForSelector(
      `${toggleControlSelector} .toggle-button--on`,
    );
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

  async waitForNetworksFilter(): Promise<void> {
    console.log(`Waiting for the network filter`);
    await this.driver.waitForSelector(this.networksToggle);
  }

  /**
   * Asserts the given asset is not listed in the token list.
   *
   * @param assetName - The asset name to verify is absent.
   */
  async checkAssetIsAbsent(assetName: string): Promise<void> {
    console.log(`Verifying asset "${assetName}" is not present in token list`);
    await this.driver.assertElementNotPresent({
      css: this.tokenName,
      text: assetName,
    });
  }

  /**
   * Asserts the visible token list contains exactly the given asset names
   * (order-independent).
   *
   * @param expectedAssets - The full set of asset names expected to be visible.
   */
  async checkOnlyAssetsArePresent(expectedAssets: string[]): Promise<void> {
    console.log(
      `Verifying token list contains exactly: ${expectedAssets.join(', ')}`,
    );
    await this.driver.waitUntil(
      async () => {
        try {
          const elements = await this.driver.findElements(this.tokenName);
          if (elements.length !== expectedAssets.length) {
            return false;
          }
          const names = await Promise.all(elements.map((e) => e.getText()));
          const got = new Set(names.map((n) => n.trim()));
          return expectedAssets.every((name) => got.has(name));
        } catch (error) {
          const err = error as { name?: string };
          if (
            err.name === 'NoSuchElementError' ||
            err.name === 'StaleElementReferenceError'
          ) {
            return false;
          }
          throw error;
        }
      },
      { timeout: this.driver.timeout, interval: 200 },
    );
  }

  async getNumberOfAssets(): Promise<number> {
    console.log(`Returning the total number of asset items in the token list`);
    const assets = await this.driver.findElements(this.tokenListItem);
    return assets.length;
  }

  async sortTokenList(
    sortBy: 'alphabetically' | 'decliningBalance',
  ): Promise<void> {
    console.log(`Sorting the token list by ${sortBy}`);
    await this.driver.clickElement(this.sortByPopoverToggle);
    if (sortBy === 'alphabetically') {
      await this.driver.clickElement(this.sortByAlphabetically);
      await this.driver.assertElementNotPresent(this.lowValueAssetsToggle);
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

  async clickTokenOptionsButton(): Promise<void> {
    console.log('Click the token options button');
    await this.driver.clickElement(this.tokenOptionsButton);
  }

  async clickManageTokens(): Promise<void> {
    console.log('Click Manage tokens in the token options menu');
    await this.driver.clickElement(this.manageTokensButton);
  }

  async importCustomTokenByChain(
    chainId: string,
    tokenAddress: string,
    symbol?: string,
    decimals?: string,
  ): Promise<void> {
    console.log(`Creating custom token ${symbol} on homepage`);
    await this.driver.waitForSelector(this.multichainTokenListButton, {
      waitAtLeastGuard: 1000,
    });
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.manageTokensButton);
    await this.driver.waitForSelector(this.tokenManagementPage);
    await this.driver.clickElement(this.tokenManagementAddCustomTokenButton);
    await this.driver.waitForSelector(this.customTokenImportPage);
    await this.driver.clickElement(this.customTokenImportNetworkSelector);
    await this.driver.clickElementAndWaitToDisappear(
      `[data-testid="network-list-item-${chainId}"]`,
    );

    await this.driver.waitForSelector(this.customTokenImportAddressInput);

    await this.driver.fill(this.customTokenImportAddressInput, tokenAddress);
    await this.driver.waitForSelector(this.customTokenImportSymbolInput);

    if (symbol) {
      // Do not fill until the button is disabled because metadata lookup can
      // re-render and clear the field in Chromium e2e.
      await this.driver.waitForSelector(this.customTokenImportSubmitButton, {
        state: 'disabled',
        waitAtLeastGuard: 1000,
      });
      await this.driver.fill(this.customTokenImportSymbolInput, symbol);
    }

    if (decimals) {
      await this.driver.waitForSelector(this.customTokenImportSubmitButton, {
        state: 'disabled',
        waitAtLeastGuard: 1000,
      });
      await this.driver.fill(this.customTokenImportDecimalInput, decimals);
    }

    await this.driver.waitForSelector(this.customTokenImportSubmitButton, {
      state: 'enabled',
    });
    await this.driver.clickElementAndWaitToDisappear(
      this.customTokenImportSubmitButton,
      20000,
    );

    await this.driver.waitForSelector(
      this.tokenManagementCustomTokenSuccessToast,
    );
    await this.returnFromTokenManagementToHome();
  }

  async importTokenBySearch({
    tokenName,
  }: {
    tokenName: string;
    networkName: string;
  }) {
    console.log(`Import token ${tokenName} on homepage by search`);
    await this.driver.waitForSelector(this.multichainTokenListButton);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.manageTokensButton);
    await this.driver.waitForSelector(this.tokenManagementPage);
    await this.driver.waitForSelector(this.tokenManagementSearchInput);
    // Keep paste to avoid flakiness because fill each word separately will cause the search to be triggered multiple times,
    // and the list will be re-rendered multiple times, leading to flakiness.
    await this.driver.pasteIntoField(
      this.tokenManagementSearchInput,
      tokenName,
    );
    const toggleControl = this.tokenManagementSearchToggleControl(tokenName);
    await this.clickTokenManagementToggle(toggleControl);
    await this.returnFromTokenManagementToHome();
  }

  async importMultipleTokensBySearch(tokenNames: string[]) {
    console.log(
      `Importing tokens ${tokenNames.join(', ')} on homepage by search`,
    );
    await this.driver.waitForSelector(this.multichainTokenListButton);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.manageTokensButton);
    await this.driver.waitForSelector(this.tokenManagementPage, {
      waitAtLeastGuard: 2000,
    });

    for (const name of tokenNames) {
      await this.driver.pasteIntoField(this.tokenManagementSearchInput, name);
      const toggleControl = this.tokenManagementSearchToggleControl(name);
      await this.clickTokenManagementToggle(toggleControl);
    }
    await this.returnFromTokenManagementToHome();
  }

  /**
   * Waits until the network filter toggle is present, visible, and no longer
   * remounting/moving before interaction. Guards against post-network-switch
   * homepage re-renders that can swallow a click.
   */
  async waitForNetworksToggleStable(): Promise<void> {
    console.log('Waiting for network filter toggle to be stable');
    await this.driver.waitUntil(
      async () => {
        return await this.driver.isElementPresentAndVisible(
          this.networksToggle,
          1000,
        );
      },
      { timeout: 15000, interval: 200, stableFor: 1000 },
    );
    await this.driver.waitForElementToStopMoving(this.networksToggle);
  }

  async openNetworksFilter(): Promise<void> {
    console.log(`Opening the network filter`);
    await this.waitForNetworksToggleStable();
    await this.driver.clickElement(this.networksToggle);
    await this.driver.waitForSelector(this.modalCloseButton);
  }

  /**
   * Opens the token details modal by finding and clicking the token in the token list
   *
   * @param tokenSymbol - The name of the token to open details for
   * @throws Error if the token with the specified name is not found
   */
  async openTokenDetails(tokenSymbol: string): Promise<void> {
    console.log(`Opening token details for ${tokenSymbol}`);
    await this.expandLowValueAssetsIfPresent();
    await this.driver.clickElement({
      text: tokenSymbol,
      css: this.tokenNameInDetails,
    });
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
    await this.driver.waitForSelector(this.coinOverviewBuyButton);
  }

  /**
   * Verifies the coin overview Send and Swap action buttons are both rendered
   * and enabled (the action buttons are not gated on the account balance, so
   * they remain present and actionable even for a zero-balance account).
   */
  async checkSendAndSwapButtonsArePresentAndEnabled(): Promise<void> {
    console.log(`Verify the Send and Swap buttons are present and enabled`);
    await this.driver.waitForSelector(this.coinOverviewSendButton, {
      state: 'enabled',
    });
    await this.driver.waitForSelector(this.coinOverviewSwapButton, {
      state: 'enabled',
    });
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
   * Checks if the expected token balance is displayed in the token list.
   *
   * @param expectedTokenBalance - The expected balance to be displayed.
   * @param symbol - The symbol of the currency or token.
   */
  async checkExpectedTokenBalanceIsDisplayed(
    expectedTokenBalance: string,
    symbol: string,
  ): Promise<void> {
    await this.expandLowValueAssetsIfPresent();
    await this.checkTokenAmountIsDisplayed(`${expectedTokenBalance} ${symbol}`);
  }

  /**
   * Refreshes the ERC20 token list by opening the token options dropdown
   * and clicking the refresh button.
   */
  async refreshErc20TokenList(): Promise<void> {
    console.log('Refresh the ERC20 token list');
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.refreshErc20Tokens);
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
    await this.expandLowValueAssetsIfPresent();
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
   * Waits for the list row’s name cell (`multichain-token-list-item-token-name`), not the
   * whole row button text (which mixes name, balance, fiat, etc.).
   *
   * @param tokenName - The name of the token to check in the list.
   * @param amount - (Optional) The amount of the token to verify if it is displayed.
   * @param [options] - Optional wait timeouts (driver default applies when omitted).
   * @param [options.timeout] - Max ms to wait for the token name cell.
   * @param [options.amountTimeout] - Max ms to wait for the amount text when `amount` is set.
   */
  async checkTokenExistsInList(
    tokenName: string,
    amount?: string,
    options: { timeout?: number; amountTimeout?: number } = {},
  ): Promise<void> {
    const { timeout, amountTimeout } = options;
    console.log(`Checking if token ${tokenName} exists in token list`);
    await this.expandLowValueAssetsIfPresent();
    await this.driver.waitForSelector(
      {
        css: this.tokenName,
        text: tokenName,
      },
      timeout === undefined ? {} : { timeout },
    );
    console.log(`Token "${tokenName}" was found in the token list`);

    if (amount) {
      await this.driver.waitForSelector(
        {
          css: this.tokenAmountValue,
          text: amount,
        },
        amountTimeout === undefined ? {} : { timeout: amountTimeout },
      );
      console.log(`Token amount ${amount} was found`);
    }
  }

  /**
   * Waits until the token at the given 1-based position matches the expected
   * name. Uses findElements + index because each token-list-button lives in
   * its own wrapper, so :nth-child cannot address position across siblings.
   *
   * @param options - The options object.
   * @param options.position - 1-based position in the token list.
   * @param options.tokenName - The expected name of the token at that position.
   */
  async checkTokenPositionInList({
    position,
    tokenName,
  }: {
    position: number;
    tokenName: string;
  }): Promise<void> {
    console.log(
      `Waiting for token at position ${position} to be "${tokenName}"`,
    );
    await this.expandLowValueAssetsIfPresent();
    const index = position - 1;
    await this.driver.waitUntil(
      async () => {
        const elements = await this.driver.findElements(this.tokenListItem);
        if (elements.length <= index) {
          return false;
        }
        const text = await elements[index].getText();
        return text.includes(tokenName);
      },
      { timeout: this.driver.timeout, interval: 100 },
    );
  }

  /**
   * This function checks if the specified number of token items is displayed in the token list.
   *
   * @param expectedNumber - The number of token items expected to be displayed. Defaults to 1.
   * @returns A promise that resolves if the expected number of token items is displayed.
   */
  async checkTokenItemNumber(expectedNumber: number = 1): Promise<void> {
    console.log(`Waiting for ${expectedNumber} token items to be displayed`);
    await this.expandLowValueAssetsIfPresent();
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
      await this.expandLowValueAssetsIfPresent();
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
      await this.driver.waitForSelector(this.tokenListItem);
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
   * @param timeout
   */
  async waitForTokenToBeDisplayed(
    tokenName: string,
    timeout: number = 10000,
  ): Promise<void> {
    await this.driver.waitForSelector(
      {
        css: this.tokenListItem,
        text: tokenName,
      },
      { timeout },
    );
  }

  /**
   * Checks if the token list prices are displayed and no "—" (em dash) placeholder is shown instead of a price
   *
   * @param timeout
   * @throws Error if a "—" placeholder is displayed instead of a conversion rate
   */
  async checkConversionRateDisplayed(timeout: number = 10000): Promise<void> {
    await this.driver.assertElementNotPresent(this.noPriceAvailableMessage, {
      timeout,
    });
  }

  async selectOnlyNetworkInFilter(
    networkName: string,
    tab: string = 'Popular',
  ): Promise<void> {
    console.log(
      `Selecting only ${networkName} in the asset list network filter`,
    );
    await this.openNetworksFilter();
    const networkManager = new NetworkManager(this.driver);
    await networkManager.selectTab(tab);
    await networkManager.selectNetworkByNameWithWait(networkName);
  }

  async selectAllNetworksInFilter(tab: string = 'Popular'): Promise<void> {
    console.log('Selecting all networks in the asset list network filter');
    await this.openNetworksFilter();
    const networkManager = new NetworkManager(this.driver);
    await networkManager.selectTab(tab);
    await networkManager.selectAllNetworks();
  }
}

export default TokensTab;
