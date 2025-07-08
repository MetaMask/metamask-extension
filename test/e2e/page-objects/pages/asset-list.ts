import { Driver } from '../../webdriver/driver';

/**
 * Page Object Model for the Asset List
 *
 * Handles token verification and asset list interactions
 */
export class AssetList {
  // Centralized selectors as constants
  private static readonly selectors = {
    tokenListItem: '[data-testid="multichain-token-list-button"]',
    tokenName: '[data-testid="multichain-token-list-item-token-name"]',
    fallbackTokenListItem: '[data-testid="multichain-token-list-item"]',
  } as const;

  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Verifies that a token with the given symbol appears in the asset list
   * Uses the same reliable approach as the working AssetListPage
   *
   * @param tokenSymbol - The symbol of the token to verify (e.g., 'TST', 'HST')
   */
  async verifyTokenIsVisible(tokenSymbol: string): Promise<void> {
    console.log(`Verifying token ${tokenSymbol} is visible in asset list`);

    // First attempt - direct check
    let tokenFound = false;
    try {
      await this.driver.waitUntil(
        async () => {
          const tokenList = await this.getTokenListNames();
          console.log(`Found tokens: ${JSON.stringify(tokenList)}`);
          return tokenList.some((token) => token.includes(tokenSymbol));
        },
        { timeout: 5000, interval: 100 }
      );
      tokenFound = true;
    } catch (error) {
      console.log(`First attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Firefox-specific: If token not found, try page refresh to force state update
    if (!tokenFound) {
      console.log('Token not found, trying page refresh for Firefox compatibility...');
      await this.driver.refresh();

      // Wait a bit for the page to reload
      await this.driver.delay(2000);

      // Try again after refresh
      await this.driver.waitUntil(
        async () => {
          const tokenList = await this.getTokenListNames();
          console.log(`Found tokens after refresh: ${JSON.stringify(tokenList)}`);
          return tokenList.some((token) => token.includes(tokenSymbol));
        },
        { timeout: 10000, interval: 100 }
      );
    }

    console.log(`Token ${tokenSymbol} successfully verified in asset list`);
  }

  /**
   * Gets the list of all token names currently displayed in the asset list
   * Tries primary selector first, then fallback for Firefox compatibility
   *
   * @returns Array of token names as strings
   */
  async getTokenListNames(): Promise<string[]> {
    console.log(`Retrieving the list of token names`);

    try {
      // Try primary selector first
      const tokenElements = await this.driver.findElements(AssetList.selectors.tokenListItem);

      if (tokenElements.length > 0) {
        const tokenNames = await Promise.all(
          tokenElements.map(async (element) => {
            return await element.getText();
          }),
        );
        return tokenNames;
      }
    } catch (error) {
      console.log(`Primary selector failed, trying fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Fallback selector for Firefox
      const fallbackElements = await this.driver.findElements(AssetList.selectors.fallbackTokenListItem);
      console.log(`Found ${fallbackElements.length} fallback elements`);

      if (fallbackElements.length > 0) {
        const tokenNames = await Promise.all(
          fallbackElements.map(async (element) => {
            return await element.getText();
          }),
        );
        return tokenNames;
      }
    } catch (error) {
      console.log(`Fallback selector failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return [];
  }

  /**
   * Clicks on a specific token in the asset list
   *
   * @param tokenSymbol - The symbol of the token to click
   */
  async clickToken(tokenSymbol: string): Promise<void> {
    console.log(`Clicking token ${tokenSymbol} in asset list`);

    // Try primary selector first
    try {
      const tokenElements = await this.driver.findElements(AssetList.selectors.tokenListItem);

      for (const element of tokenElements) {
        const text = await element.getText();
        if (text.includes(tokenSymbol)) {
          await element.click();
          return;
        }
      }
    } catch (error) {
      console.log(`Primary selector failed for clicking, trying fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Try fallback selector
    const fallbackElements = await this.driver.findElements(AssetList.selectors.fallbackTokenListItem);

    for (const element of fallbackElements) {
      const text = await element.getText();
      if (text.includes(tokenSymbol)) {
        await element.click();
        return;
      }
    }

    throw new Error(`Token "${tokenSymbol}" not found in token list`);
  }
}

export default AssetList;
