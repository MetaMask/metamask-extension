import { Driver } from '../../../../webdriver/driver';

export default class GasFeeTokenModal {
  constructor(driver: Driver) {
    this.driver = driver;
  }

  protected driver: Driver;

  private readonly listItemSymbol =
    '[data-testid="gas-fee-token-list-item-symbol"]';

  async clickToken(symbol: string): Promise<void> {
    await this.driver.clickElement({
      css: this.listItemSymbol,
      text: symbol,
    });
  }
}
