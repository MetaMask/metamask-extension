'use no memo';

import { useEffect, useMemo, useState } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayAvailableTokens } from '../../pay/useTransactionPayAvailableTokens';
import { ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS } from '../../pay/useAutomaticTransactionPayToken';
import { useIsTransactionPayLoading } from '../../pay/useTransactionPayData';
import { useTransactionAccountOverride } from '../../transactions/useTransactionAccountOverride';
import { AlertsName } from '../constants';

/**
 * Blocking alert when a money-account deposit has no funding tokens on the
 * selected account.
 */
export function useAccountNoFundsAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const availableTokens = useTransactionPayAvailableTokens();
  const isLoading = useIsTransactionPayLoading();
  const accountOverride = useTransactionAccountOverride();
  const from = currentConfirmation?.txParams?.from;
  const accountKey = `${from ?? ''}:${accountOverride ?? ''}`;
  const [seenAccountKey, setSeenAccountKey] = useState(accountKey);
  const [waitingAccountKey, setWaitingAccountKey] = useState<string | null>(
    null,
  );

  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);

  const hasTokens = availableTokens.some((token) => !token.disabled);

  // Keep the wait flag in sync during render so an account override cannot
  // flash this alert for one frame before effects run.
  if (seenAccountKey !== accountKey) {
    setSeenAccountKey(accountKey);
    setWaitingAccountKey(accountKey);
  } else if (waitingAccountKey === accountKey && hasTokens) {
    setWaitingAccountKey(null);
  }

  const isWaitingForAccountTokens =
    waitingAccountKey === accountKey && !hasTokens;

  useEffect(() => {
    if (!isWaitingForAccountTokens) {
      return;
    }

    // Funding tokens can arrive after an account override even when quote
    // loading is already false. Wait the same window as pay-token reselect
    // before treating an empty list as a final no-funds state.
    // Depend on accountKey so switching between empty accounts clears and
    // restarts this timer instead of letting an earlier timeout settle the
    // newly selected account early.
    const timeoutAccountKey = accountKey;
    const timeoutId = setTimeout(() => {
      setWaitingAccountKey((current) =>
        current === timeoutAccountKey ? null : current,
      );
    }, ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [accountKey, isWaitingForAccountTokens]);

  return useMemo(() => {
    if (
      !isMoneyAccountDeposit ||
      hasTokens ||
      isLoading ||
      isWaitingForAccountTokens
    ) {
      return [];
    }

    return [
      {
        key: AlertsName.AccountNoFunds,
        field: RowAlertKey.PayWith,
        reason: t('alertAccountNoFundsTitle'),
        message: t('alertAccountNoFundsMessage'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [
    hasTokens,
    isLoading,
    isMoneyAccountDeposit,
    isWaitingForAccountTokens,
    t,
  ]);
}
