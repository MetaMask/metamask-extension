import { Driver } from '../../webdriver/driver';

/**
 * Page Object Model for the Asset List
 * Handles token verification and asset list interactions
 */
export class AssetList {
  // Centralized selectors as constants
  private static readonly SELECTORS = {
    tokenListItem: '[data-testid="asset-list-item-',
  } as const;

  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Verifies that a token with the given symbol appears in the asset list
   * @param tokenSymbol - The symbol of the token to verify (e.g., 'TST', 'HST')
   */
  async verifyTokenIsVisible(tokenSymbol: string): Promise<void> {
    console.log(`Verifying token ${tokenSymbol} is visible in asset list`);
    await this.driver.waitForSelector(
      `${AssetList.SELECTORS.tokenListItem}${tokenSymbol}"]`,
    );
    console.log(`Token ${tokenSymbol} successfully verified in asset list`);
  }

  /**
   * Clicks on a specific token in the asset list
   * @param tokenSymbol - The symbol of the token to click
   */
  async clickToken(tokenSymbol: string): Promise<void> {
    console.log(`Clicking token ${tokenSymbol} in asset list`);
    await this.driver.clickElement(
      `${AssetList.SELECTORS.tokenListItem}${tokenSymbol}"]`,
    );
  }
}

export default AssetList;