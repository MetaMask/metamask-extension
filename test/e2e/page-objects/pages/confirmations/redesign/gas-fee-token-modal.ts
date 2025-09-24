import { Driver } from '../../../../webdriver/driver';

export default class GasFeeTokenModal {
  constructor(driver: Driver) {
    this.driver = driver;
  }

  protected driver: Driver;

  private readonly listItem = (symbol: string) =>
    `[data-testid="gas-fee-token-list-item-${symbol}"]`;

  private readonly listItemAmountFiat =
    '[data-testid="gas-fee-token-list-item-amount-fiat"]';

  private readonly listItemAmountToken =
    '[data-testid="gas-fee-token-list-item-amount-token"]';

  private readonly listItemBalance =
    '[data-testid="gas-fee-token-list-item-balance"]';

  private readonly listItemSymbol =
    '[data-testid="gas-fee-token-list-item-symbol"]';

  async checkAmountFiat(symbol: string, amountFiat: string): Promise<void> {
    await this.driver.findElement({
      css: `${this.listItem(symbol)} ${this.listItemAmountFiat}`,
      text: amountFiat,
    });
  }

  async checkAmountToken(symbol: string, amountToken: string): Promise<void> {
    await this.driver.findElement({
      css: `${this.listItem(symbol)} ${this.listItemAmountToken}`,
      text: amountToken,
    });
  }

  async checkBalance(symbol: string, balance: string): Promise<void> {
    await this.driver.findElement({
      css: `${this.listItem(symbol)} ${this.listItemBalance}`,
      text: balance,
    });
  }

  async clickToken(symbol: string): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear({
      css: this.listItemSymbol,
      text: symbol,
    });
  }
}
