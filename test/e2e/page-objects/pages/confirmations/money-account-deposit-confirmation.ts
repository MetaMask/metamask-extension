import { Key } from 'selenium-webdriver';
import { tEn } from '../../../../lib/i18n-helpers';
import {
  MetaMaskPayConfirmation,
  PAY_QUOTE_READY_TIMEOUT,
} from './metamask-pay-confirmation';

/**
 * The Money Account deposit confirmation ("Add funds"): a fiat amount input
 * on top of the shared MetaMask Pay confirmation.
 *
 * Screen: wallet-initiated confirmation opened by the Money home "Add"
 * action (not a route of its own).
 * Owns: amount input and percentage buttons, the "Add funds" header and
 * confirm label, and the loaded check for this flow.
 * Boundaries: shared Pay pills, quote rows, and the confirm click belong to
 * `MetaMaskPayConfirmation`. The Money home page that opens this belongs to
 * `MoneyHomePage`. The pay-with and account pickers are
 * `MetaMaskPaySourceModal` and `MetaMaskPayAccountSelectModal`, driven from
 * `metamask-pay.flow.ts`.
 * Related: `MetaMaskPayConfirmation`, `MoneyHomePage`.
 *
 * @see ui/pages/confirmations/components/info/money-account-deposit-info/money-account-deposit-info.tsx
 */
export class MoneyAccountDepositConfirmation extends MetaMaskPayConfirmation {
  private readonly addFundsButton = {
    testId: 'confirm-footer-button',
    text: tEn('addFunds'),
  };

  private readonly amountInput = { testId: 'custom-amount-input' };

  private readonly customAmountInfo = { testId: 'custom-amount-info' };

  private readonly headerTitle = {
    testId: 'wallet-initiated-header-title',
    text: tEn('addFunds'),
  };

  private readonly percentageButton = (percentage: number) => ({
    testId: `percentage-button-${percentage}`,
  });

  private readonly percentageButtons = { testId: 'percentage-buttons' };

  async checkAmount(expectedAmount: string): Promise<void> {
    console.log(`Wait for deposit amount to be "${expectedAmount}"`);
    await this.driver.waitUntil(
      async () => {
        const input = await this.driver.findElement(this.amountInput);
        return (await input.getAttribute('value')) === expectedAmount;
      },
      { interval: 100, timeout: PAY_QUOTE_READY_TIMEOUT },
    );
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for Money Account deposit confirmation to load');
    await this.driver.waitForMultipleSelectors([
      this.confirmationPage,
      this.headerBackButton,
      this.headerTitle,
      this.confirmButton,
    ]);
    // The amount screen shows a skeleton until Pay resolves the required
    // token and the pay-with row settles on a funded token.
    await this.driver.waitForMultipleSelectors(
      [this.customAmountInfo, this.amountInput, this.payWithRow],
      { timeout: PAY_QUOTE_READY_TIMEOUT },
    );
  }

  async checkPercentageButtonsDisplayed(): Promise<void> {
    console.log('Check percentage buttons are displayed');
    await this.driver.waitForSelector(this.percentageButtons);
  }

  /**
   * Wait for the quote-derived rows and the "Add funds" button to enable.
   */
  async checkQuoteIsReady(): Promise<void> {
    console.log('Wait for deposit quote rows and enabled Add funds button');
    await this.checkQuoteRows();
    await this.driver.waitForSelector(this.addFundsButton, {
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
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
    console.log('Clear deposit amount');
    const input = await this.driver.findElement(this.amountInput);
    const currentValue = (await input.getAttribute('value')) ?? '';
    await this.driver.press(
      this.amountInput,
      Key.END + Key.BACK_SPACE.repeat(currentValue.length),
    );
    await this.checkAmount('0');
  }

  async clickMax(): Promise<void> {
    console.log('Click Max percentage button');
    await this.driver.clickElement(this.percentageButton(100));
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
}

export default MoneyAccountDepositConfirmation;
