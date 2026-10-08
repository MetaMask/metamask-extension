import { Key } from 'selenium-webdriver';
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
 * assertions, the shared amount input and percentage buttons, the quote rows
 * (fee / time / total), header back, and the footer confirm click.
 * Boundaries: inherits footer/nav from `Confirmation`. Flow-specific header
 * titles, confirm labels, and loaded checks belong to subclasses
 * (`MoneyAccountDepositConfirmation`). The modals opened by the pills are
 * `MetaMaskPaySourceModal` and `MetaMaskPayAccountSelectModal`, driven from
 * `metamask-pay.flow.ts`.
 * Related: `Confirmation`, `MoneyAccountDepositConfirmation`.
 *
 * @see ui/pages/confirmations/confirm/confirm.tsx
 */
export class MetaMaskPayConfirmation extends Confirmation {
  protected readonly amountInput = { testId: 'custom-amount-input' };

  protected readonly bridgeFeeRow = { testId: 'bridge-fee-row' };

  protected readonly bridgeTimeRow = { testId: 'bridge-time-row' };

  protected readonly confirmationPage = {
    testId: 'parent-selector-confirmation-page',
  };

  protected readonly confirmButton = { testId: 'confirm-footer-button' };

  protected readonly customAmountInfo = { testId: 'custom-amount-info' };

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

  private readonly percentageButton = (percentage: number) => ({
    testId: `percentage-button-${percentage}`,
  });

  private readonly percentageButtons = { testId: 'percentage-buttons' };

  protected readonly totalRow = (total: string) => ({
    testId: 'total-row',
    text: total,
  });

  protected readonly transactionFeeValue = { testId: 'transaction-fee-value' };

  async checkAmount(expectedAmount: string): Promise<void> {
    console.log(`Wait for Pay amount to be "${expectedAmount}"`);
    await this.driver.waitUntil(
      async () => {
        const input = await this.driver.findElement(this.amountInput);
        return (await input.getAttribute('value')) === expectedAmount;
      },
      { interval: 100, timeout: PAY_QUOTE_READY_TIMEOUT },
    );
  }

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

  async checkPercentageButtonsDisplayed(): Promise<void> {
    console.log('Check percentage buttons are displayed');
    await this.driver.waitForSelector(this.percentageButtons);
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

  /**
   * Delete the current amount character by character. The amount field is a
   * controlled input that normalises an empty value to `0`, and the
   * select-all shortcut `driver.fill` relies on does not clear it reliably
   * across platforms (it is a no-op on macOS Chrome), so backspacing is the
   * dependable way to reset it.
   */
  async clearAmount(): Promise<void> {
    console.log('Clear Pay amount');
    const input = await this.driver.findElement(this.amountInput);
    const currentValue = (await input.getAttribute('value')) ?? '';
    await this.driver.press(
      this.amountInput,
      Key.END + Key.BACK_SPACE.repeat(currentValue.length),
    );
    await this.checkAmount('0');
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

  async clickMax(): Promise<void> {
    console.log('Click Max percentage button');
    await this.driver.clickElement(this.percentageButton(100));
  }

  async clickPayWithPill(): Promise<void> {
    console.log('Click Pay with pill');
    await this.driver.waitForSelector(this.payWithPill, {
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
    await this.driver.clickElement(this.payWithPill);
  }

  async clickPercentage(percentage: number): Promise<void> {
    console.log(`Click ${percentage}% percentage button`);
    await this.driver.clickElement(this.percentageButton(percentage));
  }

  /**
   * Replace the current amount with `amount`. See {@link clearAmount} for why
   * this does not use `driver.fill`.
   *
   * @param amount - Fiat amount to type, e.g. `50`.
   */
  async fillAmount(amount: string): Promise<void> {
    console.log(`Fill Pay amount ${amount}`);
    await this.driver.waitForSelector(this.amountInput, { state: 'enabled' });
    await this.clearAmount();
    // Typing onto the normalised `0` yields `0<amount>`, which the field
    // strips back to `<amount>`.
    await this.driver.press(this.amountInput, amount);
    await this.checkAmount(amount);
  }

  async goBack(): Promise<void> {
    console.log('Click Pay confirmation back button');
    await this.driver.clickElement(this.headerBackButton);
  }
}

export default MetaMaskPayConfirmation;
