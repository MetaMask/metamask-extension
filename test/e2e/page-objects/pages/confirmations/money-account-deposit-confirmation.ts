import { Key } from 'selenium-webdriver';
import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

// Fetching the Relay quote, rendering the fee / time rows and enabling the
// "Add funds" button can take longer than the default 10s wait on slower CI
// browsers, so quote-dependent waits get more room.
const QUOTE_READY_TIMEOUT = 60_000;

/**
 * The Money Account deposit confirmation ("Add funds"): a fiat amount input
 * backed by MetaMask Pay quotes from a wallet token into Monad mUSD.
 *
 * Screen: wallet-initiated confirmation opened by the Money home "Add"
 * action (not a route of its own).
 * Owns: amount input and percentage buttons, the from-account and pay-with
 * pills, the quote rows (fee / time / total), the header back button and the
 * "Add funds" confirm button.
 * Boundaries: the Money home page that opens this belongs to
 * `MoneyHomePage`; the pay-with and account pickers opened by the pills are
 * `PayWithModal` and `AccountSelectModal`, driven from
 * `money-account-deposit.flow.ts`.
 * Related: `MoneyHomePage`, `PayWithModal`, `AccountSelectModal`.
 *
 * @see ui/pages/confirmations/components/info/money-account-deposit-info/money-account-deposit-info.tsx
 */
export class MoneyAccountDepositConfirmation {
  private readonly addFundsButton = {
    testId: 'confirm-footer-button',
    text: tEn('addFunds'),
  };

  private readonly amountInput = { testId: 'custom-amount-input' };

  private readonly bridgeFeeRow = { testId: 'bridge-fee-row' };

  private readonly bridgeTimeRow = { testId: 'bridge-time-row' };

  private readonly confirmButton = { testId: 'confirm-footer-button' };

  private readonly customAmountInfo = { testId: 'custom-amount-info' };

  private readonly driver: Driver;

  private readonly fromAccountName = (accountName: string) => ({
    testId: 'from-account-name',
    text: accountName,
  });

  private readonly fromAccountPill = { testId: 'from-account-pill' };

  private readonly headerBackButton = {
    testId: 'wallet-initiated-header-back-button',
  };

  private readonly headerTitle = {
    testId: 'wallet-initiated-header-title',
    text: tEn('addFunds'),
  };

  private readonly parentSelector = {
    testId: 'parent-selector-confirmation-page',
  };

  private readonly payWithPill = { testId: 'pay-with-pill' };

  private readonly payWithRow = { testId: 'pay-with-row' };

  private readonly payWithSymbol = (symbol: string) => ({
    testId: 'pay-with-symbol',
    text: symbol,
  });

  private readonly percentageButton = (percentage: number) => ({
    testId: `percentage-button-${percentage}`,
  });

  private readonly percentageButtons = { testId: 'percentage-buttons' };

  private readonly totalRow = (total: string) => ({
    testId: 'total-row',
    text: total,
  });

  private readonly transactionFeeValue = { testId: 'transaction-fee-value' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAmount(expectedAmount: string): Promise<void> {
    console.log(`Wait for deposit amount to be "${expectedAmount}"`);
    await this.driver.waitUntil(
      async () => {
        const input = await this.driver.findElement(this.amountInput);
        return (await input.getAttribute('value')) === expectedAmount;
      },
      { interval: 100, timeout: QUOTE_READY_TIMEOUT },
    );
  }

  async checkFromAccount(accountName: string): Promise<void> {
    console.log(`Wait for from-account pill to show "${accountName}"`);
    await this.driver.waitForSelector(this.fromAccountName(accountName));
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for Money Account deposit confirmation to load');
    await this.driver.waitForMultipleSelectors([
      this.parentSelector,
      this.headerBackButton,
      this.headerTitle,
      this.confirmButton,
    ]);
    // The amount screen shows a skeleton until Pay resolves the required
    // token and the pay-with row settles on a funded token.
    await this.driver.waitForMultipleSelectors(
      [this.customAmountInfo, this.amountInput, this.payWithRow],
      { timeout: QUOTE_READY_TIMEOUT },
    );
  }

  /**
   * Assert the pay-with pill shows the given token symbol.
   *
   * @param symbol - Token symbol, e.g. `USDC`.
   */
  async checkPayWithToken(symbol: string): Promise<void> {
    console.log(`Wait for pay-with pill to show "${symbol}"`);
    await this.driver.waitForSelector(this.payWithSymbol(symbol), {
      timeout: QUOTE_READY_TIMEOUT,
    });
  }

  async checkPercentageButtonsDisplayed(): Promise<void> {
    console.log('Check percentage buttons are displayed');
    await this.driver.waitForSelector(this.percentageButtons);
  }

  /**
   * Wait for the quote-derived rows (transaction fee, estimated time, total)
   * to render for the entered amount and the "Add funds" button to enable.
   */
  async checkQuoteIsReady(): Promise<void> {
    console.log('Wait for deposit quote rows and enabled Add funds button');
    await this.driver.waitForMultipleSelectors(
      [this.bridgeFeeRow, this.transactionFeeValue, this.bridgeTimeRow],
      { timeout: QUOTE_READY_TIMEOUT },
    );
    await this.driver.waitForSelector(this.addFundsButton, {
      timeout: QUOTE_READY_TIMEOUT,
    });
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
      timeout: QUOTE_READY_TIMEOUT,
    });
  }

  async checkTotal(expectedTotal: string): Promise<void> {
    console.log(`Wait for deposit total to be "${expectedTotal}"`);
    await this.driver.waitForSelector(this.totalRow(expectedTotal), {
      timeout: QUOTE_READY_TIMEOUT,
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
    console.log('Clear deposit amount');
    const input = await this.driver.findElement(this.amountInput);
    const currentValue = (await input.getAttribute('value')) ?? '';
    await this.driver.press(
      this.amountInput,
      Key.END + Key.BACK_SPACE.repeat(currentValue.length),
    );
    await this.checkAmount('0');
  }

  async clickConfirm(): Promise<void> {
    console.log('Click Add funds');
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
      timeout: QUOTE_READY_TIMEOUT,
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
    console.log(`Fill deposit amount ${amount}`);
    await this.driver.waitForSelector(this.amountInput, { state: 'enabled' });
    await this.clearAmount();
    // Typing onto the normalised `0` yields `0<amount>`, which the field
    // strips back to `<amount>`.
    await this.driver.press(this.amountInput, amount);
    await this.checkAmount(amount);
  }

  async goBack(): Promise<void> {
    console.log('Click deposit confirmation back button');
    await this.driver.clickElement(this.headerBackButton);
  }
}

export default MoneyAccountDepositConfirmation;
