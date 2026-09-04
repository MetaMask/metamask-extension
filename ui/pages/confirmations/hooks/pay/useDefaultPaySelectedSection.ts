import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../useConfirmationNavigation';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';

/**
 * Applies the Money Account payment override when either:
 * - `defaultPaySelectedSection` selects it for this confirmation type, or
 * - the confirmation was opened with `payWithOption=money_account`
 * (Money Account → Perps / Predict).
 *
 * Runs once per transaction id so later user picks (crypto, other assets)
 * are not overwritten.
 */
export function useDefaultPaySelectedSection(): void {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const { payWithOption } = useConfirmationNavigationOptions();
  const moneyAccount = useSelector(selectPrimaryMoneyAccount);
  const isDefaultMoneyAccount = useIsMoneyAccountFlagDefault();
  const appliedRef = useRef<string | undefined>(undefined);
  const transactionId = transactionMeta?.id;
  const isMoneyAccountNavigation =
    payWithOption === PayWithOption.MoneyAccount &&
    hasTransactionType(transactionMeta, [TransactionType.perpsDeposit]);

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
