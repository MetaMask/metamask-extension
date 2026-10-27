import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';
import { MoneyAccountDepositConfirmation } from './money-account-deposit-confirmation';

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
}

export default MoneyAccountWithdrawConfirmation;
