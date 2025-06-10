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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenBalanceWithName(tokenListItemValue: string) {
    console.log(
      'Check if token balance is displayed on token list item',
      tokenListItemValue,
    );
    await this.driver.waitForSelector({
      css: this.tokenListItemValue,
      text: tokenListItemValue,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenMarketValue(tokenListItemSecondaryValue: string) {
    console.log(
      'Check if token market value is displayed on token list item',
      tokenListItemSecondaryValue,
    );
    await this.driver.waitForSelector({
      css: this.tokenListItemSecondaryValue,
      text: tokenListItemSecondaryValue,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenName(tokenName: string) {
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
