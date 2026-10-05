import Confirmation from './confirmation';

// Fetching the Relay quote and rendering the fee / time rows can take longer
// than the default 10s wait on slower CI browsers.
export const PAY_QUOTE_READY_TIMEOUT = 60_000;

/**
 * Shared MetaMask Pay confirmation chrome for quote-backed, wallet-initiated
 * confirmations (Money Account deposit, and the same pills on Perps).
 *
 * Screen: wallet-initiated confirmation opened by a Pay flow (not a route of
 * its own).
 * Owns: the from-account and pay-with pills, pay-token and funding-account
 * assertions, the quote rows (fee / time / total), header back, and the
 * footer confirm click.
 * Boundaries: inherits footer/nav from `Confirmation`. Flow-specific amount
 * controls and header titles belong to subclasses
 * (`MoneyAccountDepositConfirmation`). The modals opened by the pills are
 * `MetaMaskPaySourceModal` and `MetaMaskPayAccountSelectModal`, driven from
 * `metamask-pay.flow.ts`.
 * Related: `Confirmation`, `MoneyAccountDepositConfirmation`.
 *
 * @see ui/pages/confirmations/confirm/confirm.tsx
 */
export class MetaMaskPayConfirmation extends Confirmation {
  protected readonly bridgeFeeRow = { testId: 'bridge-fee-row' };

  protected readonly bridgeTimeRow = { testId: 'bridge-time-row' };

  protected readonly confirmationPage = {
    testId: 'parent-selector-confirmation-page',
  };

  protected readonly confirmButton = { testId: 'confirm-footer-button' };

  protected readonly fromAccountName = (accountName: string) => ({
    testId: 'from-account-name',
    text: accountName,
  });

  protected readonly fromAccountPill = { testId: 'from-account-pill' };

  protected readonly headerBackButton = {
    testId: 'wallet-initiated-header-back-button',
  };

  protected readonly payWithPill = { testId: 'pay-with-pill' };

  protected readonly payWithRow = { testId: 'pay-with-row' };

  protected readonly payWithSymbol = (symbol: string) => ({
    testId: 'pay-with-symbol',
    text: symbol,
  });

  protected readonly totalRow = (total: string) => ({
    testId: 'total-row',
    text: total,
  });

  protected readonly transactionFeeValue = { testId: 'transaction-fee-value' };

  async checkFromAccount(accountName: string): Promise<void> {
    console.log(`Wait for from-account pill to show "${accountName}"`);
    await this.driver.waitForSelector(this.fromAccountName(accountName));
  }

  /**
   * Assert the pay-with pill shows the given token symbol.
   *
   * @param symbol - Token symbol, e.g. `USDC`.
   */
  async checkPayWithToken(symbol: string): Promise<void> {
    console.log(`Wait for pay-with pill to show "${symbol}"`);
    await this.driver.waitForSelector(this.payWithSymbol(symbol), {
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
  }

  /**
   * Wait for the quote-derived fee and estimated-time rows.
   */
  async checkQuoteRows(): Promise<void> {
    console.log('Wait for MetaMask Pay quote rows');
    await this.driver.waitForMultipleSelectors(
      [this.bridgeFeeRow, this.transactionFeeValue, this.bridgeTimeRow],
      { timeout: PAY_QUOTE_READY_TIMEOUT },
    );
  }

  async checkTotal(expectedTotal: string): Promise<void> {
    console.log(`Wait for Pay total to be "${expectedTotal}"`);
    await this.driver.waitForSelector(this.totalRow(expectedTotal), {
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
  }

  async clickConfirm(): Promise<void> {
    console.log('Click MetaMask Pay confirm button');
    // Firefox WebDriver often reports a successful element.click() without
    // firing the React handler, leaving the confirmation unapproved.
    await this.driver.clickElementUsingMouseMove(this.confirmButton);
  }

  async clickFromAccountPill(): Promise<void> {
    console.log('Click from-account pill');
    await this.driver.clickElement(this.fromAccountPill);
  }

  async clickPayWithPill(): Promise<void> {
    console.log('Click Pay with pill');
    await this.driver.waitForSelector(this.payWithPill, {
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
    await this.driver.clickElement(this.payWithPill);
  }

  async goBack(): Promise<void> {
    console.log('Click Pay confirmation back button');
    await this.driver.clickElement(this.headerBackButton);
  }
}

export default MetaMaskPayConfirmation;
