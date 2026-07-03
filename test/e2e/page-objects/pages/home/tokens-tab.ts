import { strict as assert } from 'assert';
import { By, WebElement } from 'selenium-webdriver';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import { veryLargeDelayMs } from '../../../helpers';
import NetworkManager from '../network-manager';
import HomePage from './homepage';

class TokensTab extends HomePage {
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

  private readonly customTokenModalOption =
    '[data-testid="import-tokens-modal-custom-token-tab"]';

  private readonly hideTokenButton = '[data-testid="asset-options__hide"]';

  private readonly hideTokenConfirmationButton =
    '[data-testid="hide-token-confirmation__hide"]';

  private readonly hideTokenConfirmationModalTitle = {
    text: 'Hide token',
    css: '.hide-token-confirmation__title',
  };

  private readonly importTokenModalTitle = { text: 'Import tokens', tag: 'h4' };

  private readonly importTokensButton = '[data-testid="importTokens"]';

  private readonly importTokensLoading = {
    testId: 'import-tokens-loading',
  };

  private readonly importTokensNextButton =
    '[data-testid="import-tokens-button-next"]';

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

  private readonly selectedNetwork = (networkName: string) => {
    return {
      testId: 'test-import-tokens-drop-down-custom-import',
      text: networkName,
    };
  };

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

  private readonly tokenNameInDetails =
    '[data-testid="multichain-token-list-item-token-name"]';

  private readonly tokenImportedMessageCloseButton =
    '.actionable-message__message button[aria-label="Close"]';

  private readonly tokenSearchResults = '.token-list__token_component';

  private readonly tokenListItem =
    '[data-testid="multichain-token-list-button"]';

  private readonly tokenOptionsButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private readonly tokenSearchSelected =
    '.token-list__tokens-container .mm-checkbox__input--checked';

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

  private readonly tokenDecimalsInput =
    '[data-testid="import-tokens-modal-custom-decimals"]';

  private readonly modalWarningBanner = '[data-testid="custom-token-warning"]';

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
      css: this.tokenName,
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
    await this.driver.clickElement(this.tokenImportedMessageCloseButton);
    await this.driver.assertElementNotPresent(this.tokenImportedSuccessMessage);
  }

  /**
   * Expands the collapsed low-value assets section when the toggle is present.
   */
  async expandLowValueAssets(): Promise<void> {
    await this.expandLowValueAssetsIfPresent();
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
    // on chrome the test is going to fast so this can fail without a wait
    await this.driver.delay(1000);
    await this.driver.waitForSelector(this.customTokenModalOption);
    await this.driver.clickElement(this.customTokenModalOption);
    await this.driver.waitForSelector(this.modalWarningBanner);
    // Wait for the input to be present and stable after modal content re-renders
    await this.driver.waitForSelector(this.tokenAddressInput);

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

    if (decimals) {
      await this.driver.waitForSelector(this.importTokensNextButton, {
        state: 'disabled',
        waitAtLeastGuard: 1000,
      });
      await this.driver.fill(this.tokenDecimalsInput, decimals);
    }

    await this.driver.waitForSelector(this.tokenDecimalsTitle);
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.waitForSelector(this.tokenConfirmListItem);
    // Same readiness condition as `importTokenBySearch`: confirm copy means
    // `pendingTokens` is populated and the confirm step finished rendering before Import.
    await this.driver.waitForSelector(this.confirmImportTokenMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportTokenButton,
      20000,
    );

    await this.driver.waitForSelector(this.tokenImportedSuccessMessage);
  }

  async importTokenBySearch({
    tokenName,
    networkName,
  }: {
    tokenName: string;
    networkName: string;
  }) {
    console.log(`Import token ${tokenName} on homepage by search`);
    await this.driver.waitForSelector(this.multichainTokenListButton);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.waitForSelector(this.selectedNetwork(networkName));
    await this.driver.assertElementNotPresent(this.importTokensLoading, {
      findElementGuard: this.importTokenModalTitle,
    });
    await this.driver.waitForSelector(this.tokenSearchInput);
    // Keep paste to avoid flakiness because fill each word separately will cause the search to be triggered multiple times,
    // and the list will be re-rendered multiple times, leading to flakiness.
    await this.driver.pasteIntoField(this.tokenSearchInput, tokenName);
    // Wait until the token search matches 1 result to prevent flakiness with token result re-renders
    await this.waitUntilTokenSearchMatch(1);
    await this.driver.waitForElementToStopMoving({ text: tokenName, tag: 'p' });
    await this.driver.clickElement({ text: tokenName, tag: 'p' });
    await this.driver.waitForSelector(this.tokenSearchSelected);
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
    await this.driver.waitForSelector(this.importTokenModalTitle, {
      waitAtLeastGuard: 2000,
    });

    for (const name of tokenNames) {
      await this.driver.pasteIntoField(this.tokenSearchInput, name);
      // Wait for the async search results to fully settle before interacting,
      // mirroring the guard in importTokenBySearch.
      await this.waitUntilTokenSearchMatch(1);
      await this.driver.waitForElementToStopMoving({ text: name, tag: 'p' });
      await this.driver.clickElement({ text: name, tag: 'p' });
      await this.driver.waitForSelector(this.tokenSearchSelected);
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
        timeout: 15_000,
        interval: 100,
      },
    );
  }

  /**
   * Opens the Network Manager modal and selects only Tron, scoping the asset
   * list to a single network.
   */
  async selectOnlyTronInNetworkFilter(): Promise<void> {
    console.log('Selecting only Tron in the asset list network filter');
    await this.openNetworksFilter();
    const networkManager = new NetworkManager(this.driver);
    await networkManager.selectTab('Popular');
    await networkManager.selectNetworkByNameWithWait('Tron');
  }

  /**
   * Opens the Network Manager modal and selects all popular networks.
   */
  async selectAllNetworksInNetworkFilter(): Promise<void> {
    console.log(
      'Selecting all popular networks in the asset list network filter',
    );
    await this.openNetworksFilter();
    const networkManager = new NetworkManager(this.driver);
    await networkManager.selectTab('Popular');
    await networkManager.selectAllNetworks();
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

  async checkTokenRowContainsAllText(
    tokenName: string,
    expectedTexts: string[],
  ): Promise<void> {
    for (const expectedText of expectedTexts) {
      await this.checkTokenRowContainsText(tokenName, expectedText);
    }
  }

  async checkTokenRowContainsText(
    tokenName: string,
    expectedText: string,
  ): Promise<void> {
    console.log(`Checking token row "${tokenName}" contains "${expectedText}"`);
    const row = await this.findTokenRowByName(tokenName);
    assert.ok(
      (await row.getText()).includes(expectedText),
      `Expected "${tokenName}" row to contain "${expectedText}"`,
    );
  }

  async checkTokenRowHasVisibleLogo(tokenName: string): Promise<void> {
    console.log(`Checking token row "${tokenName}" has a visible logo`);
    const row = await this.findTokenRowByName(tokenName);
    const logo = await row.findElement(By.css('.mm-avatar-token'));
    assert.ok(
      await logo.isDisplayed(),
      `Expected "${tokenName}" row to display a token logo`,
    );
  }

  /**
   * Asserts the asset list contains exactly the given asset names by token-name
   * cell, and no others.
   *
   * @param symbols - Token name texts to require, in any order.
   */
  async checkOnlyAssetsArePresent(symbols: string[]): Promise<void> {
    console.log(
      `Checking only these assets are present: ${symbols.join(', ')}`,
    );
    await this.expandLowValueAssetsIfPresent();
    for (const symbol of symbols) {
      await this.driver.waitForSelector({
        css: this.tokenName,
        text: symbol,
      });
    }
    await this.checkTokenItemNumber(symbols.length);
  }

  /**
   * Waits for the low-value assets toggle with the expected token count label.
   *
   * @param expectedCount - Number of tokens in the collapsed low-value section.
   */
  async checkLowValueAssetsToggleIsPresent(
    expectedCount: number,
  ): Promise<void> {
    console.log(
      `Checking low-value assets toggle is present with count ${expectedCount}`,
    );
    await this.driver.waitForSelector({
      css: this.lowValueAssetsToggle,
      text: `Low value tokens (${expectedCount})`,
    });
  }

  /**
   * Asserts the token list row count without expanding the low-value section.
   *
   * @param expectedNumber - Visible token rows in the main list.
   */
  async checkCollapsedTokenItemNumber(expectedNumber: number): Promise<void> {
    console.log(
      `Waiting for ${expectedNumber} collapsed token items to be displayed`,
    );
    await this.driver.wait(
      async () => {
        const tokenItemsNumber = await this.getNumberOfAssets();
        return tokenItemsNumber === expectedNumber;
      },
      30_000,
    );
  }

  /**
   * Waits for a token name cell without expanding the low-value section.
   *
   * @param tokenName - Token name text to match.
   * @param options
   * @param options.timeout
   */
  async checkTokenNameVisible(
    tokenName: string,
    options: { timeout?: number } = {},
  ): Promise<void> {
    console.log(`Checking token name "${tokenName}" is visible`);
    await this.driver.waitForSelector(
      {
        css: this.tokenName,
        text: tokenName,
      },
      options.timeout === undefined ? {} : { timeout: options.timeout },
    );
  }

  async checkAssetIsAbsent(symbol: string): Promise<void> {
    console.log(`Checking asset is absent: ${symbol}`);
    await this.driver.assertElementNotPresent({
      css: this.tokenName,
      text: symbol,
    });
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

  async waitUntilTokenSearchMatch(numberOfMatches: number) {
    await this.driver.waitUntil(
      async () => {
        const matches = await this.driver.findElements(this.tokenSearchResults);
        return matches.length === numberOfMatches;
      },
      {
        timeout: this.driver.timeout,
        interval: 200,
        stableFor: veryLargeDelayMs,
      },
    );
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

  private async findTokenRowByName(tokenName: string): Promise<WebElement> {
    await this.expandLowValueAssetsIfPresent();

    let matchingRow: WebElement | undefined;

    await this.driver.waitUntil(
      async () => {
        const rows = await this.driver.findElements(this.tokenListItem);
        for (const row of rows) {
          const nameElement = await row.findElement(By.css(this.tokenName));
          if ((await nameElement.getText()) === tokenName) {
            matchingRow = row;
            return true;
          }
        }

        return false;
      },
      { timeout: 10000, interval: 500 },
    );

    if (!matchingRow) {
      throw new Error(`Could not find token row for ${tokenName}`);
    }

    return matchingRow;
  }
}

export default TokensTab;
