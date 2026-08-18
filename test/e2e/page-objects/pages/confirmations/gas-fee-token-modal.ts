import { Driver } from '../../../webdriver/driver';

/**
 * Modal for selecting which token pays the network fee.
 *
 * Screen: overlay modal opened from the selected gas-fee-token control on a
 * transaction confirmation (not a hash route).
 * Owns: gas-fee-token list items (symbol, balance, fiat/token amounts) and
 * selecting a token.
 * Boundaries: gas estimate tiers and advanced gas forms belong to
 * `GasFeeModal`. Opening the token picker from the confirmation belongs to
 * `TransactionConfirmation`.
 * Related: `TransactionConfirmation`, `GasFeeModal`.
 *
 * @see ui/pages/confirmations/components/confirm/info/shared/gas-fee-token-modal/gas-fee-token-modal.tsx
 * @see ui/pages/confirmations/components/confirm/info/shared/gas-fee-token-list-item/gas-fee-token-list-item.tsx
 */
export default class GasFeeTokenModal {
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

  constructor(driver: Driver) {
    this.driver = driver;
  }

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
