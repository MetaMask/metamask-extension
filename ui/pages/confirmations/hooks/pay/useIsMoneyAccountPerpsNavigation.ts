import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { selectIsMoneyAccountTransactionEnabled } from '../../selectors/feature-flags';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../useConfirmationNavigation';

/**
 * Whether this confirmation is a Money Account → Perps deposit, i.e. it was
 * opened with `payWithOption=money_account` and Money Account pay is enabled
 * for `perpsDeposit`.
 *
 * The query param on its own is not enough: developer options and restored
 * URLs can carry it while `enableMoneyAccountTransactions.perpsDeposit` is
 * off, which would lock the confirmation to a funding source the flag has not
 * enabled and hide the token picker that would let the user recover.
 *
 * @returns Whether Money Account funds this Perps deposit.
 */
export function useIsMoneyAccountPerpsNavigation(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const { payWithOption } = useConfirmationNavigationOptions();

  const isMoneyAccountPayEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, TransactionType.perpsDeposit),
  );

  return (
    payWithOption === PayWithOption.MoneyAccount &&
    isMoneyAccountPayEnabled &&
    hasTransactionType(transactionMeta, [TransactionType.perpsDeposit])
  );
}
