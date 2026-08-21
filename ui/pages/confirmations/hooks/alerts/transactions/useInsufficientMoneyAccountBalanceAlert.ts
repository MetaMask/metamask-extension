'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import { useQuery } from '@metamask/react-data-query';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../../../../shared/lib/money/query-keys';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

const MUSD_UNIT = 10 ** MUSD_DECIMALS;

/**
 * Inert query key used when the confirmation is not a money-account withdraw.
 * Deliberately not a `DATA_SERVICES` name so the query client does not open a
 * background messenger subscription for it.
 */
const NON_WITHDRAW_QUERY_KEY = 'money-account-withdraw-alert:disabled';

/**
 * Blocking alert when a money-account withdraw exceeds withdrawable vmUSD.
 *
 * Reads the same react-query cache `useMoneyAccountBalance` writes (from the
 * withdraw info messenger) so this can run in `useConfirmationAlerts` without
 * requiring a money-account route messenger.
 *
 * Mirrors mobile `useInsufficientMoneyAccountBalanceAlert`.
 *
 * @param options
 * @param options.pendingAmount - Optional in-progress human mUSD amount.
 */
export function useInsufficientMoneyAccountBalanceAlert({
  pendingAmount,
}: {
  pendingAmount?: string;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const isMoneyAccountWithdraw = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountWithdraw,
  ]);
  const moneyAccountAddress = currentConfirmation?.txParams?.from;

  // This hook runs from `useConfirmationAlerts` for every confirmation, but
  // only withdrawals can produce this alert. `useQuery` registers a cache
  // observer even when `enabled` is false, and the query client subscribes to
  // the owning data service on the first observer — so a money-account key
  // here would open a `messengerSubscribe` for unrelated confirmations. Use a
  // key outside `DATA_SERVICES` unless this really is a withdraw, which leaves
  // the query inert and skips the subscription entirely.
  const moneyBalanceQuery = useQuery<CanonicalMoneyAccountBalanceResponse>({
    queryKey: isMoneyAccountWithdraw
      ? [
          MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
          moneyAccountAddress ?? '',
        ]
      : [NON_WITHDRAW_QUERY_KEY],
    enabled: false,
  });

  const amountHuman = pendingAmount ?? primaryRequiredToken?.amountHuman ?? '0';

  const withdrawableMusd = useMemo(() => {
    if (
      !isMoneyAccountWithdraw ||
      moneyBalanceQuery.isLoading ||
      moneyBalanceQuery.isError ||
      !moneyBalanceQuery.data
    ) {
      return undefined;
    }

    return new BigNumber(
      moneyBalanceQuery.data.vmusdValueInMusd ?? 0,
    ).dividedBy(MUSD_UNIT);
  }, [
    isMoneyAccountWithdraw,
    moneyBalanceQuery.data,
    moneyBalanceQuery.isError,
    moneyBalanceQuery.isLoading,
  ]);

  const isInsufficient =
    isMoneyAccountWithdraw &&
    withdrawableMusd !== undefined &&
    withdrawableMusd.lt(amountHuman);

  return useMemo(() => {
    if (!isInsufficient) {
      return [];
    }

    return [
      {
        field: RowAlertKey.Amount,
        isBlocking: true,
        key: AlertsName.InsufficientMoneyAccountBalance,
        message: t('alertInsufficientPayTokenBalance'),
        reason: t('alertInsufficientPayTokenBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [isInsufficient, t]);
}
