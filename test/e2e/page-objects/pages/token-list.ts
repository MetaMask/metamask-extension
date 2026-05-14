import { Driver } from '../../webdriver/driver';

class TokenList {
  protected readonly driver: Driver;

  protected readonly tokenListItemTokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  protected readonly tokenListItemValue =
    '[data-testid="multichain-token-list-item-value"]';

  protected readonly tokenListItemSecondaryValue =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  protected readonly lowValueAssetsToggle =
    '[data-testid="low-value-assets-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Expands the "low value tokens" group when present so callers can find rows
   * that fall under the sub-$1 / unknown-fiat threshold. No-op otherwise.
   */
  protected async expandLowValueAssetsIfPresent(): Promise<void> {
    const isPresent = await this.driver.isElementPresent({
      css: this.lowValueAssetsToggle,
    });
    if (!isPresent) {
      return;
    }

    const toggle = await this.driver.findElement(this.lowValueAssetsToggle);
    const ariaExpanded = await toggle.getAttribute('aria-expanded');
    if (ariaExpanded === 'true') {
      return;
    }

    await this.driver.clickElement(this.lowValueAssetsToggle);
  }

  async checkTokenBalanceWithName(tokenListItemValue: string) {
    console.log(
      'Check if token balance is displayed on token list item',
      tokenListItemValue,
    );
    await this.expandLowValueAssetsIfPresent();
    await this.driver.waitForSelector({
      css: this.tokenListItemValue,
      text: tokenListItemValue,
    });
  }

  async checkTokenMarketValue(tokenListItemSecondaryValue: string) {
    console.log(
      'Check if token market value is displayed on token list item',
      tokenListItemSecondaryValue,
    );
    await this.expandLowValueAssetsIfPresent();
    await this.driver.waitForSelector({
      css: this.tokenListItemSecondaryValue,
      text: tokenListItemSecondaryValue,
    });
  }

  async checkTokenName(tokenName: string) {
    console.log(
      'Check if token name is displayed on token list item',
      tokenName,
    );
    await this.expandLowValueAssetsIfPresent();
    await this.driver.waitForSelector({
      css: this.tokenListItemTokenName,
      text: tokenName,
    });
  }
}

export default TokenList;
