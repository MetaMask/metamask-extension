import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';
import { useIsMoneyAccountPerpsNavigation } from './useIsMoneyAccountPerpsNavigation';

/**
 * Applies the Money Account payment override when either:
 * - `defaultPaySelectedSection` selects it for this confirmation type, or
 * - the confirmation was opened with `payWithOption=money_account`
 * (Money Account → Perps / Predict) and that route is flag-enabled.
 *
 * Runs once per transaction id so later user picks (crypto, other assets)
 * are not overwritten.
 */
export function useDefaultPaySelectedSection(): void {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const moneyAccount = useSelector(selectPrimaryMoneyAccount);
  const isDefaultMoneyAccount = useIsMoneyAccountFlagDefault();
  const isMoneyAccountNavigation = useIsMoneyAccountPerpsNavigation();
  const appliedRef = useRef<string | undefined>(undefined);
  const transactionId = transactionMeta?.id;

  useEffect(() => {
    if (
      (!isDefaultMoneyAccount && !isMoneyAccountNavigation) ||
      !transactionId ||
      appliedRef.current === transactionId
    ) {
      return;
    }

    appliedRef.current = transactionId;

    applyMoneyAccountOverride(
      transactionId,
      moneyAccount?.address,
      transactionMeta,
    );
  }, [
    isDefaultMoneyAccount,
    isMoneyAccountNavigation,
    moneyAccount?.address,
    transactionId,
    transactionMeta,
  ]);
}
