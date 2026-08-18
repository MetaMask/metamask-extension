import { strict as assert } from 'assert';
import { By, WebElement } from 'selenium-webdriver';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import { largeDelayMs, veryLargeDelayMs } from '../../../helpers';
import HomePage from './homepage';

/** Timeout for waiting on the import-confirm button to disappear after submit. */
const TOKEN_IMPORT_CONFIRM_TIMEOUT_MS = 20_000;

const SEARCH_TOKEN_ASSET_IDS: Record<string, string> = {
  BAT: 'eip155:56/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  CHAI: 'eip155:1/erc20:0x06af07097c9eeb7fd685c692751d5c66db49c215',
  CHAIN: 'eip155:1/erc20:0xc4c2614e694cf534d407ee49f8e44d125e4681c4',
  CHANGE: 'eip155:1/erc20:0x7051faed0775f664a0286af4f75ef5ed74e02754',
  DAI: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
  'MUSICAL TOKEN': 'eip155:1/erc20:0x0994206dfe8de6ec6920ff4d779b0d950605fb53',
  MUSD: 'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
};

/**
 * Home Tokens tab: asset list, import/manage tokens, sort, and token details.
 *
 * Screen: `#/` Tokens tab (`account-overview__asset-tab`), the default home
 * tab; also reached via `HomePage.goToTokensTab()`.
 * Owns: token rows (name, balance, fiat, position), low-value expand/sort,
 * import via search or custom address, manage-tokens toggles, hide token,
 * and opening a row for price/chart/address checks.
 * Boundaries: homepage balance and Send/Swap/Bridge CTAs stay on `HomePage`.
 * Network filter control-bar chrome belongs to `NetworkFilter` /
 * `SelectNetworkModal`. Full `#/asset/...` journeys beyond open checks are
 * outside this object.
 * Related: `HomePage` (`goToTokensTab`), `NonEvmHomepage`, `NetworkFilter`,
 * `flows/multi-srp.flow.ts` / `flows/bitcoin-send.flow.ts`.
 *
 * @see ui/components/app/assets/asset-list/asset-list.tsx
 */
class TokensTab extends HomePage {
  private readonly assetMarketCapInDetailsModal =
    '[data-testid="asset-market-cap"]';

  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly assetPriceInDetailsModal =
    '[data-testid="asset-hovered-price"]';

  private readonly coinOverviewBuyButton = '[data-testid="coin-overview-buy"]';

  private readonly coinOverviewSendButton =
    '[data-testid="coin-overview-send"]';

  private readonly coinOverviewSwapButton =
    '[data-testid="coin-overview-swap"]';

  private readonly confirmImportTokenButton =
    '[data-testid="import-tokens-modal-import-button"]';

  private readonly confirmImportTokenMessage = {
    text: 'Would you like to import this token?',
    tag: 'p',
  };

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

  private readonly importTokenNetworkDropdown = (networkName: string) => {
    return {
      css: this.tokenChainDropdown,
      text: networkName,
    };
  };

  private readonly importTokensButton = '[data-testid="importTokens-button"]';

  private readonly importTokensLoading = {
    testId: 'import-tokens-loading',
  };

  private readonly importTokensNextButton =
    '[data-testid="import-tokens-button-next"]';

  private readonly lowValueAssetsToggle =
    '[data-testid="low-value-assets-toggle"]';

  private readonly lowValueAssetsToggleExpanded = `${this.lowValueAssetsToggle}[aria-expanded="true"]`;

  private readonly manageTokensButton = '[data-testid="manageTokens__button"]';

  private readonly modalWarningBanner = '[data-testid="custom-token-warning"]';

  private readonly multichainTokenListButton = {
    testId: 'multichain-token-list-button',
  };

  private readonly noPriceAvailableMessage = {
    css: '[data-testid="multichain-token-list-item-secondary-value"]',
    text: '—',
  };

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly refreshErc20Tokens = {
    testId: 'refreshList',
  };

  private readonly sortByAlphabetically =
    '[data-testid="sortByAlphabetically"]';

  private readonly sortByDecliningBalance =
    '[data-testid="sortByDecliningBalance"]';

  private readonly sortByPopoverToggle =
    '[data-testid="sort-by-popover-toggle"]';

  private readonly tokenAddressInDetails =
    '[data-testid="address-copy-button-text"]';

  private readonly tokenAddressInput =
    '[data-testid="import-tokens-modal-custom-address"]';

  private readonly tokenAmountValue =
    '[data-testid="multichain-token-list-item-value"]';

  private readonly tokenChainDropdown =
    '[data-testid="test-import-tokens-drop-down-custom-import"]';

  private readonly tokenConfirmListItem =
    '.import-tokens-modal__confirm-token-list-item-wrapper';

  private readonly tokenDecimalsInput =
    '[data-testid="import-tokens-modal-custom-decimals"]';

  private readonly tokenDecimalsTitle = {
    css: '.mm-label',
    text: 'Token decimal',
  };

  private readonly tokenFiatAmount =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  private readonly tokenImportedMessageCloseButton =
    '.actionable-message__message button[aria-label="Close"]';

  private readonly tokenImportedSuccessMessage = {
    text: 'Token imported',
    tag: 'h6',
  };

  private readonly tokenIncreaseDecreaseValue =
    '[data-testid="token-increase-decrease-value"]';

  private readonly tokenListItem =
    '[data-testid="multichain-token-list-button"]';

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

  private readonly tokenNameInDetails =
    '[data-testid="multichain-token-list-item-token-name"]';

  private readonly tokenOptionsButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private readonly tokenSearchInput = 'input[placeholder="Search tokens"]';

  private readonly tokenSearchResults = '.token-list__token_component';

  private readonly tokenSearchSelected =
    '.token-list__tokens-container .mm-checkbox__input--checked';

  private readonly tokenSymbolInput =
    '[data-testid="import-tokens-modal-custom-symbol"]';

  private readonly tokenSymbolTitle = {
    css: '.mm-label',
    text: 'Token symbol',
  };

  async checkAssetIsAbsent(symbol: string): Promise<void> {
    console.log(`Checking asset is absent: ${symbol}`);
    await this.driver.assertElementNotPresent({
      css: this.tokenName,
      text: symbol,
    });
  }

  async checkBuySellButtonIsPresent(): Promise<void> {
    console.log(`Verify the buy/sell button is displayed`);
    await this.driver.waitForSelector(this.coinOverviewBuyButton);
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
    await this.driver.wait(async () => {
      const tokenItemsNumber = await this.getNumberOfAssets();
      return tokenItemsNumber === expectedNumber;
    }, 30_000);
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

  async checkMultichainTokenListButtonIsPresent(): Promise<void> {
    console.log(`Verify the multichain-token-list-button is displayed`);
    await this.driver.waitForSelector(this.tokenListItem);
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

  async checkTokenPrice(expectedPrice: string): Promise<void> {
    console.log(`Verifying token price ${expectedPrice}`);
    await this.driver.waitForSelector({
      css: this.assetPriceInDetailsModal,
      text: expectedPrice,
    });
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

    const expectedAddressFormat = `${tokenAddress.slice(0, 7)}...${tokenAddress.slice(37)}`;

    await this.driver.waitForSelector({
      css: this.tokenAddressInDetails,
      text: expectedAddressFormat,
    });
    console.log(`Token details verified successfully for ${symbol}`);
  }

  async clickManageTokens(): Promise<void> {
    console.log('Click Manage tokens in the token options menu');
    await this.driver.clickElement(this.manageTokensButton);
  }

  async clickMultichainTokenListButton(): Promise<void> {
    console.log('Clicking on multichain token list button');
    await this.driver.clickElement(this.multichainTokenListButton);
  }

  async clickOnAsset(assetName: string): Promise<void> {
    console.log(`Clicking on the token name `);
    await this.expandLowValueAssetsIfPresent();
    await this.driver.clickElement({
      css: this.tokenListItem,
      text: assetName,
    });
  }

  private async clickTokenManagementToggle(toggleControlSelector: string) {
    await this.driver.clickElementSafe(
      `${toggleControlSelector} .toggle-button--off`,
    );
    await this.driver.waitForSelector(
      `${toggleControlSelector} .toggle-button--on`,
    );
  }

  async clickTokenOptionsButton(): Promise<void> {
    console.log('Click the token options button');
    await this.driver.clickElement(this.tokenOptionsButton);
  }

  /**
   * Dismisses the "Token imported" success message by clicking the close button
   */
  async dismissTokenImportedMessage(): Promise<void> {
    console.log('Dismissing token imported success message');
    await this.driver.clickElementSafe(this.tokenImportedMessageCloseButton);
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

  /**
   * Imports a custom token via the Import tokens modal confirm flow.
   * Prefer this for new assets E2E coverage; existing tests use
   * `importCustomTokenByChain` (Manage tokens / custom token import page).
   *
   * @param chainId - Hex chain ID of the network to import the token on.
   * @param tokenAddress - Contract address of the custom token.
   * @param symbol - Optional token symbol override when metadata lookup is incomplete.
   * @param decimals - Optional token decimals override when metadata lookup is incomplete.
   */
  async importCustomTokenByChainViaImportModal(
    chainId: string,
    tokenAddress: string,
    symbol?: string,
    decimals?: string,
  ): Promise<void> {
    console.log(`Creating custom token ${symbol} on homepage via import modal`);
    await this.driver.waitForSelector(this.multichainTokenListButton, {
      waitAtLeastGuard: largeDelayMs,
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
      this.importTokenNetworkDropdown(networkName),
    );
    await this.driver.waitForSelector(this.customTokenModalOption, {
      state: 'enabled',
    });
    await this.driver.waitForElementToStopMoving(this.customTokenModalOption);
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
        waitAtLeastGuard: largeDelayMs,
      });
      await this.driver.fill(this.tokenSymbolInput, symbol);
    }

    if (decimals) {
      await this.driver.waitForSelector(this.importTokensNextButton, {
        state: 'disabled',
        waitAtLeastGuard: largeDelayMs,
      });
      await this.driver.fill(this.tokenDecimalsInput, decimals);
    }

    await this.driver.waitForSelector(this.tokenDecimalsTitle);
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.waitForSelector(this.tokenConfirmListItem);
    // Same readiness condition as `importTokenBySearchViaImportModal`: confirm copy means
    // `pendingTokens` is populated and the confirm step finished rendering before Import.
    await this.driver.waitForSelector(this.confirmImportTokenMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportTokenButton,
      TOKEN_IMPORT_CONFIRM_TIMEOUT_MS,
    );

    await this.driver.waitForSelector(this.tokenImportedSuccessMessage);
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
   * Imports multiple tokens by search via the Import tokens modal confirm flow.
   * Prefer this for new assets E2E coverage; existing tests use
   * `importMultipleTokensBySearch` (Manage tokens page).
   *
   * @param tokenNames - Token names to search for and select, in order.
   */
  async importMultipleTokensBySearchViaImportModal(tokenNames: string[]) {
    console.log(
      `Importing tokens ${tokenNames.join(', ')} on homepage by search via import modal`,
    );
    await this.driver.waitForSelector(this.multichainTokenListButton);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle, {
      waitAtLeastGuard: veryLargeDelayMs,
    });

    for (const name of tokenNames) {
      await this.driver.pasteIntoField(this.tokenSearchInput, name);
      // Wait for the async search results to fully settle before interacting,
      // mirroring the guard in importTokenBySearchViaImportModal.
      await this.waitUntilTokenSearchMatch(1);
      await this.driver.waitForElementToStopMoving({ text: name, tag: 'p' });
      await this.driver.clickElement({ text: name, tag: 'p' });
      await this.driver.waitForSelector(this.tokenSearchSelected);
    }
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportTokenButton,
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

  /**
   * Imports a token by search via the Import tokens modal confirm flow.
   * Prefer this for new assets E2E coverage; existing tests use
   * `importTokenBySearch` (Manage tokens page).
   *
   * @param options - Search import options.
   * @param options.tokenName - Token name to search for and select.
   * @param options.networkName - Expected network name shown on the import modal dropdown.
   */
  async importTokenBySearchViaImportModal({
    tokenName,
    networkName,
  }: {
    tokenName: string;
    networkName: string;
  }) {
    console.log(
      `Import token ${tokenName} on homepage by search via import modal`,
    );
    await this.driver.waitForSelector(this.multichainTokenListButton);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.waitForSelector(
      this.importTokenNetworkDropdown(networkName),
    );
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
    await this.driver.waitForSelector(this.tokenImportedSuccessMessage);
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

  /**
   * Refreshes the ERC20 token list by opening the token options dropdown
   * and clicking the refresh button.
   */
  async refreshErc20TokenList(): Promise<void> {
    console.log('Refresh the ERC20 token list');
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.refreshErc20Tokens);
  }

  private async returnFromTokenManagementToHome(): Promise<void> {
    await this.driver.clickElement(this.tokenManagementBackButton);
    await this.driver.waitForSelector(this.multichainTokenListButton);
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

  private tokenImportSelectNetwork(chainId: string): string {
    return `[data-testid="select-network-item-${chainId}"]`;
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

  private tokenPercentage(address: string): string {
    return `[data-testid="token-increase-decrease-percentage-${address}"]`;
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
}

export default TokensTab;
