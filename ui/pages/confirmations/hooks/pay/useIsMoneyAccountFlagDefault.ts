import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import {
  selectDefaultPaySelectedSection,
  selectEnableMoneyAccountTransactions,
} from '../../selectors/feature-flags';
import { getConfirmationTransactionType } from '../../utils/confirm';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

const PERPS_PREDICT_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

const PERPS_FLAG_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
];

const PREDICT_FLAG_TYPES: TransactionType[] = [
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

/**
 * Returns `true` when `defaultPaySelectedSection` maps this confirmation's
 * type to `"money-account"`, Money Account pay is enabled for that type, and
 * the user has a money account.
 *
 * Perps deposit and withdraw share a flag family: a money-account value on
 * either key applies to both. Same for predict. A `default` key is used when
 * no family key is set.
 *
 * No-ops when `enableMoneyAccountTransactions` does not enable the current
 * type, so the flag cannot default Money Account when it is not a pay option.
 *
 * Only applies to perps / predict transaction types so the flag cannot
 * default Money Account for unrelated flows.
 *
 * @returns Whether Money Account is the flag-configured default pay method.
 */
export function useIsMoneyAccountFlagDefault(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const moneyAccount = useSelector(selectPrimaryMoneyAccount);
  const defaultPaySelectedSection = useSelector(
    selectDefaultPaySelectedSection,
  );
  const enableMoneyAccountTransactions = useSelector(
    selectEnableMoneyAccountTransactions,
  );

  const isPerpsOrPredict = hasTransactionType(
    transactionMeta,
    PERPS_PREDICT_TRANSACTION_TYPES,
  );

  const effectiveType = getConfirmationTransactionType(transactionMeta);
  const sectionForType = getDefaultPaySection(
    defaultPaySelectedSection,
    effectiveType,
  );
  const isMoneyAccountPayEnabled = Boolean(
    effectiveType && enableMoneyAccountTransactions[effectiveType],
  );

  return (
    sectionForType === 'money-account' &&
    Boolean(moneyAccount) &&
    isPerpsOrPredict &&
    isMoneyAccountPayEnabled
  );
}

function getDefaultPaySection(
  map: Record<string, string>,
  transactionType?: TransactionType,
): string | undefined {
  if (transactionType && map[transactionType]) {
    return map[transactionType];
  }

  const family = getFlagFamily(transactionType);
  if (family) {
    const familyValue = family
      .map((type) => map[type])
      .find((value) => value !== undefined);
    if (familyValue !== undefined) {
      return familyValue;
    }
  }

  return map.default;
}

function getFlagFamily(
  transactionType?: TransactionType,
): TransactionType[] | undefined {
  if (!transactionType) {
    return undefined;
  }
  if (PERPS_FLAG_TYPES.includes(transactionType)) {
    return PERPS_FLAG_TYPES;
  }
  if (PREDICT_FLAG_TYPES.includes(transactionType)) {
    return PREDICT_FLAG_TYPES;
  }
  return undefined;
}
