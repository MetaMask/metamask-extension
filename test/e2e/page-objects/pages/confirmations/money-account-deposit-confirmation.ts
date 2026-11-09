import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';
import {
  MetaMaskPayConfirmation,
  PAY_QUOTE_READY_TIMEOUT,
} from './metamask-pay-confirmation';

/**
 * Header and confirm-button copy for a Money custom-amount confirmation.
 * Deposit and withdraw share this screen but use different labels.
 */
type MoneyAccountConfirmationLabels = {
  confirmText: string;
  headerText: string;
};

const DEFAULT_DEPOSIT_PAY_TOKEN_SYMBOL = 'USDC';

/**
 * The Money Account deposit confirmation: "Add to MetaMask Money" in the
 * header and "Convert [token]" on the confirm button, on top of the shared
 * MetaMask Pay confirmation.
 *
 * Screen: wallet-initiated confirmation opened by the Money home "Add"
 * action (not a route of its own).
 * Owns: the deposit header and confirm label, and the loaded and
 * quote-ready checks for this flow.
 * Boundaries: the amount input, percentage buttons, Pay pills, quote rows,
 * and the confirm click belong to `MetaMaskPayConfirmation`. The Money home
 * page that opens this belongs to `MoneyHomePage`. The pay-with and account
 * pickers are `MetaMaskPaySourceModal` and `MetaMaskPayAccountSelectModal`,
 * driven from `metamask-pay.flow.ts`.
 * Related: `MetaMaskPayConfirmation`, `MoneyHomePage`.
 *
 * @see ui/pages/confirmations/components/info/money-account-deposit-info/money-account-deposit-info.tsx
 */
export class MoneyAccountDepositConfirmation extends MetaMaskPayConfirmation {
  private readonly confirmLabel: { testId: string; text: string };

  private readonly headerTitle: { testId: string; text: string };

  /**
   * @param driver - The WebDriver instance.
   * @param labels - Header title and confirm-button label. Deposit defaults
   * to "Add to MetaMask Money" and "Convert USDC". Withdraw passes "Send"
   * for both.
   */
  constructor(
    driver: Driver,
    labels: MoneyAccountConfirmationLabels = {
      confirmText: tEn('moneyAccountDepositConvert', [
        DEFAULT_DEPOSIT_PAY_TOKEN_SYMBOL,
      ]),
      headerText: tEn('moneyAccountDepositHeader'),
    },
  ) {
    super(driver);
    this.headerTitle = {
      testId: 'wallet-initiated-header-title',
      text: labels.headerText,
    };
    this.confirmLabel = {
      testId: 'confirm-footer-button',
      text: labels.confirmText,
    };
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

  /**
   * Wait for the quote-derived rows and the confirm button to enable.
   */
  async checkQuoteIsReady(): Promise<void> {
    console.log('Wait for deposit quote rows and enabled confirm button');
    await this.checkQuoteRows();
    await this.driver.waitForSelector(this.confirmLabel, {
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
      timeout: PAY_QUOTE_READY_TIMEOUT,
    });
  }
}

export default MoneyAccountDepositConfirmation;
