import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import {
  selectDefaultPaySelectedSection,
  selectIsMoneyAccountTransactionEnabled,
} from '../../selectors/feature-flags';
import {
  selectTransactionPaymentTokenByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { getConfirmationTransactionType } from '../../utils/confirm';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

const PERPS_PREDICT_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

/**
 * Returns `true` when `defaultPaySelectedSection` maps this confirmation's
 * type to `"money-account"`, Money Account pay is enabled for that type, and
 * the user has a money account.
 *
 * The transaction type must be named explicitly in the flag. Neither a
 * `default` key nor the sibling deposit / withdraw key defaults Money Account
 * for a type of its own accord: Money Account ↔ Perps and ↔ Predict are rolled
 * out per direction, and a shared fallback would opt a direction in before its
 * quote and settlement paths are enabled.
 *
 * No-ops when `enableMoneyAccountTransactions` does not enable the current
 * type, so the flag cannot default Money Account when it is not a pay option.
 *
 * Only applies to perps / predict transaction types so the flag cannot
 * default Money Account for unrelated flows.
 *
 * Also defers to an already-selected pay token: when a token has been picked
 * for this transaction (e.g. pre-selected by the Hyperliquid deposit prompt
 * before navigation), the flag no longer defaults to Money Account so the
 * explicit choice is not overridden on the Perps deposit screen.
 *
 * @returns Whether Money Account is the flag-configured default pay method.
 */
export function useIsMoneyAccountFlagDefault(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const moneyAccount = useSelector(selectPrimaryMoneyAccount);
  const payToken = useSelector((state: TransactionPayState) =>
    selectTransactionPaymentTokenByTransactionId(
      state,
      transactionMeta?.id ?? '',
    ),
  );
  const defaultPaySelectedSection = useSelector(
    selectDefaultPaySelectedSection,
  );
  const effectiveType = getConfirmationTransactionType(transactionMeta);
  const isMoneyAccountPayEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, effectiveType),
  );

  const isPerpsOrPredict = hasTransactionType(
    transactionMeta,
    PERPS_PREDICT_TRANSACTION_TYPES,
  );

  const sectionForType = effectiveType
    ? defaultPaySelectedSection[effectiveType]
    : undefined;

  return (
    !payToken &&
    sectionForType === 'money-account' &&
    Boolean(moneyAccount) &&
    isPerpsOrPredict &&
    isMoneyAccountPayEnabled
  );
}
