import { Driver } from '../../webdriver/driver';

class TokenList {
  protected readonly driver: Driver;

  protected readonly lowValueAssetsToggle =
    '[data-testid="low-value-assets-toggle"]';

  protected readonly lowValueAssetsToggleExpanded = `${this.lowValueAssetsToggle}[aria-expanded="true"]`;

  protected readonly tokenListItemTokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  protected readonly tokenListItemValue =
    '[data-testid="multichain-token-list-item-value"]';

  protected readonly tokenListItemSecondaryValue =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private async expandLowValueAssetsIfPresent(): Promise<void> {
    let toggle;

    try {
      toggle = await this.driver.findElement(this.lowValueAssetsToggle, 1000);
    } catch {
      return;
    }

    if ((await toggle.getAttribute('aria-expanded')) === 'true') {
      return;
    }

    await this.driver.clickElement(this.lowValueAssetsToggle);
    await this.driver.waitForSelector(this.lowValueAssetsToggleExpanded, {
      timeout: 5000,
    });
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
