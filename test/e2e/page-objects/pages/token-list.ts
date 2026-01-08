import { Driver } from '../../webdriver/driver';

class TokenList {
  protected readonly driver: Driver;

  protected readonly tokenListItemTokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  protected readonly tokenListItemValue =
    '[data-testid="multichain-token-list-item-value"]';

  protected readonly tokenListItemSecondaryValue =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkTokenBalanceWithName(tokenListItemValue: string) {
    console.log(
      'Check if token balance is displayed on token list item',
      tokenListItemValue,
    );
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
    await this.driver.waitForSelector({
      css: this.tokenListItemTokenName,
      text: tokenName,
    });
  }
}

export default TokenList;
