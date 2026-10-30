import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';
import { MoneyAccountDepositConfirmation } from './money-account-deposit-confirmation';
import { PAY_QUOTE_READY_TIMEOUT } from './metamask-pay-confirmation';

/**
 * The Money Account withdraw confirmation ("Send"): the same custom-amount
 * screen as a deposit, headed "Send", drawing its max from the vault
 * withdrawable balance and paying out to a receive token.
 *
 * @see ui/pages/confirmations/components/info/money-account-withdraw-info/money-account-withdraw-info.tsx
 */
export class MoneyAccountWithdrawConfirmation extends MoneyAccountDepositConfirmation {
  constructor(driver: Driver) {
    super(driver, tEn('send'));
  }

  /**
   * Wait for the quote-derived rows. Quoted withdrawals are gasless Relay
   * execute quotes, so the fee row reads "Paid by MetaMask".
   */
  async checkQuoteRows(): Promise<void> {
    console.log('Wait for Money Account withdraw quote rows');
    await this.driver.waitForMultipleSelectors(
      [this.bridgeFeeRow, this.paidByMetaMask, this.bridgeTimeRow],
      { timeout: PAY_QUOTE_READY_TIMEOUT },
    );
  }
}

export default MoneyAccountWithdrawConfirmation;
