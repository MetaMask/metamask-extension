import { Key } from 'selenium-webdriver';
import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';
import { AccountSelectModal } from './account-select-modal';
import { PayWithModal } from './pay-with-modal';

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
 * `MoneyHomePage`; the pay-with and account pickers are `PayWithModal` and
 * `AccountSelectModal`, exposed here as helpers.
 * Related: `MoneyHomePage`, `PayWithModal`, `AccountSelectModal`.
 *
 * @see ui/pages/confirmations/components/info/money-account-deposit-info/money-account-deposit-info.tsx
 */
export class MoneyAccountDepositConfirmation {
  private readonly amountInput = { testId: 'custom-amount-input' };

  private readonly bridgeFeeRow = { testId: 'bridge-fee-row' };

  private readonly bridgeTimeRow = { testId: 'bridge-time-row' };

  private readonly confirmButton = { testId: 'confirm-footer-button' };

  private readonly customAmountInfo = { testId: 'custom-amount-info' };

  private readonly driver: Driver;

  private readonly fromAccountName = { testId: 'from-account-name' };

  private readonly fromAccountPill = { testId: 'from-account-pill' };

  private readonly headerBackButton = {
    testId: 'wallet-initiated-header-back-button',
  };

  private readonly headerTitle = {
    xpath: `//*[@data-testid='wallet-initiated-header-back-button']/following-sibling::*[normalize-space(.)='${tEn(
      'addFunds',
    )}']`,
  };

  private readonly parentSelector = {
    testId: 'parent-selector-confirmation-page',
  };

  private readonly payWithPill = { testId: 'pay-with-pill' };

  private readonly payWithRow = { testId: 'pay-with-row' };

  private readonly payWithSymbol = { testId: 'pay-with-symbol' };

  private readonly percentageButton = (percentage: number) => ({
    testId: `percentage-button-${percentage}`,
  });

  private readonly percentageButtons = { testId: 'percentage-buttons' };

  private readonly totalRow = { testId: 'total-row' };

  private readonly transactionFeeValue = { testId: 'transaction-fee-value' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAmount(expectedAmount: string): Promise<void> {
    console.log(`Wait for deposit amount to be "${expectedAmount}"`);
    const input = await this.driver.findElement(this.amountInput);
    await this.driver.wait(
      async () => (await input.getAttribute('value')) === expectedAmount,
      QUOTE_READY_TIMEOUT,
    );
  }

  async checkFromAccount(accountName: string): Promise<void> {
    await this.driver.waitForSelector({
      ...this.fromAccountName,
      text: accountName,
    });
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
    await this.driver.waitForSelector(
      { ...this.payWithSymbol, text: symbol },
      { timeout: QUOTE_READY_TIMEOUT },
    );
  }

  async checkPercentageButtonsDisplayed(): Promise<void> {
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
    await this.driver.waitForSelector(
      { ...this.confirmButton, text: tEn('addFunds') },
      { timeout: QUOTE_READY_TIMEOUT },
    );
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
      timeout: QUOTE_READY_TIMEOUT,
    });
  }

  async checkTotal(expectedTotal: string): Promise<void> {
    await this.driver.waitForSelector(
      { ...this.totalRow, text: expectedTotal },
      { timeout: QUOTE_READY_TIMEOUT },
    );
  }

  /**
   * Delete the current amount character by character. The amount field is a
   * controlled input that normalises an empty value to `0`, and select-all
   * shortcuts are not reliable against it across platforms, so backspacing is
   * the dependable way to reset it.
   */
  async clearAmount(): Promise<void> {
    console.log('Clear deposit amount');
    const input = await this.driver.findElement(this.amountInput);
    const currentValue = (await input.getAttribute('value')) ?? '';
    await input.sendKeys(
      Key.END,
      ...Array<string>(currentValue.length).fill(Key.BACK_SPACE),
    );
    await this.checkAmount('0');
  }

  async clickConfirm(): Promise<void> {
    console.log('Click Add funds');
    // Firefox WebDriver often reports a successful element.click() without
    // firing the React handler, leaving the confirmation unapproved.
    await this.driver.clickElementUsingMouseMove(this.confirmButton);
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
   * Replace the current amount with `amount`.
   *
   * @param amount - Fiat amount to type, e.g. `50`.
   */
  async fillAmount(amount: string): Promise<void> {
    console.log(`Fill deposit amount ${amount}`);
    await this.driver.waitForSelector(this.amountInput, { state: 'enabled' });
    await this.clearAmount();
    const input = await this.driver.findElement(this.amountInput);
    // Typing onto the normalised `0` yields `0<amount>`, which the field
    // strips back to `<amount>`.
    await input.sendKeys(amount);
    await this.checkAmount(amount);
  }

  async goBack(): Promise<void> {
    await this.driver.clickElement(this.headerBackButton);
  }

  /**
   * Open the account picker from the from-account pill.
   *
   * @returns The opened `AccountSelectModal`.
   */
  async openAccountSelector(): Promise<AccountSelectModal> {
    console.log('Open funding account selector');
    await this.driver.clickElement(this.fromAccountPill);
    const modal = new AccountSelectModal(this.driver);
    await modal.checkPageIsLoaded();
    return modal;
  }

  /**
   * Open the "Pay with" token picker from the pay-with pill.
   *
   * @returns The opened `PayWithModal`.
   */
  async openPayWith(): Promise<PayWithModal> {
    console.log('Open Pay with token selector');
    await this.driver.waitForSelector(this.payWithPill, {
      timeout: QUOTE_READY_TIMEOUT,
    });
    await this.driver.clickElement(this.payWithPill);
    const modal = new PayWithModal(this.driver);
    await modal.checkPageIsLoaded();
    return modal;
  }

  /**
   * Fund the deposit from a different wallet account.
   *
   * @param address - Address of the account to fund from.
   * @param accountName - Display name expected on the pill afterwards.
   */
  async selectFundingAccount(
    address: string,
    accountName: string,
  ): Promise<void> {
    const modal = await this.openAccountSelector();
    await modal.selectAccount(address);
    await this.checkFromAccount(accountName);
  }

  /**
   * Pick the pay token from the wallet asset list.
   *
   * @param chainId - Hex chain id of the token, e.g. `0x1`.
   * @param symbol - Token symbol, e.g. `USDC`.
   */
  async selectPayToken(chainId: string, symbol: string): Promise<void> {
    const modal = await this.openPayWith();
    await modal.openOtherAssets();
    await modal.selectToken(chainId, symbol);
    await this.checkPayWithToken(symbol);
  }
}

export default MoneyAccountDepositConfirmation;
