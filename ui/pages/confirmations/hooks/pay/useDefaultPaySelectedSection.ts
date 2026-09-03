import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';

/**
 * Applies the Money Account payment override when
 * `defaultPaySelectedSection` selects it for this confirmation type.
 *
 * Runs once per transaction id so later user picks (crypto, other assets)
 * are not overwritten.
 */
export function useDefaultPaySelectedSection(): void {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const moneyAccount = useSelector(selectPrimaryMoneyAccount);
  const isDefaultMoneyAccount = useIsMoneyAccountFlagDefault();
  const appliedRef = useRef<string | undefined>(undefined);
  const transactionId = transactionMeta?.id;

  useEffect(() => {
    if (
      !isDefaultMoneyAccount ||
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
    moneyAccount?.address,
    transactionId,
    transactionMeta,
  ]);
}
