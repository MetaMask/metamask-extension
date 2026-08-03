'use no memo';

import { useEffect, useMemo, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import type { AccountState } from '@metamask/perps-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { coalesceBackgroundRequest } from '../../../../../hooks/perps/coalesceBackgroundRequest';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';
import { usePerpsCacheKey } from '../../../../../hooks/perps/usePerpsCacheKey';
import { submitRequestToBackground } from '../../../../../store/background-connection';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

const PERPS_WITHDRAW_AMOUNT_DECIMALS = 6;

// Coalescing window for the fresh read. Long enough that re-mounting the
// confirmation (or a sibling Perps surface asking for the same account state)
// reuses one HL request instead of adding weight against the per-IP budget,
// short enough that the balance the user is blocked on is still current.
const FRESH_BALANCE_TTL_MS = 5000;

type SettledBalance =
  | { status: 'loaded'; balance: string }
  /** The read failed or returned no account. We do not invent a balance. */
  | { status: 'unavailable' };

type FreshBalance =
  /** Not a Perps withdraw, so Perps was never queried. */
  | { status: 'idle' }
  /** Fresh read in flight; the balance is not known yet. */
  | { status: 'loading' }
  | SettledBalance;

/**
 * Reads the Perps account state the provider itself validates withdrawals
 * against, instead of the streamed WebSocket cache.
 *
 * The `PerpsStreamManager` cache is a page-realm singleton that only holds
 * data while something subscribes to it, so after an MV3 UI/service-worker
 * restart it reads empty — and it can hold a stale balance while the provider
 * sees a newer one. Basing a blocking decision on it lets the confirmation and
 * the provider disagree in both directions.
 *
 * @param enabled - Only true for `perpsWithdraw` confirmations. While false,
 * nothing is requested, so unrelated confirmations never initialize or query
 * the Perps controller.
 */
function useFreshPerpsWithdrawableBalance(enabled: boolean): FreshBalance {
  const perpsCacheKey = usePerpsCacheKey();
  // Keyed by the Perps scope the read was issued for, so a result from the
  // previous account, network or provider is never shown for the current one.
  const [settled, setSettled] = useState<{
    perpsCacheKey: string;
    balance: SettledBalance;
  } | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    const resolve = (balance: SettledBalance) => {
      if (!cancelled) {
        setSettled({ perpsCacheKey, balance });
      }
    };

    coalesceBackgroundRequest<AccountState | null>(
      `perpsGetAccountState|${perpsCacheKey}`,
      () =>
        submitRequestToBackground<AccountState | null>(
          'perpsGetAccountState',
          [],
        ),
      FRESH_BALANCE_TTL_MS,
    )
      .then((account) =>
        resolve(
          account
            ? { status: 'loaded', balance: getTradeableBalance(account) }
            : { status: 'unavailable' },
        ),
      )
      .catch(() => resolve({ status: 'unavailable' }));

    return () => {
      cancelled = true;
    };
  }, [enabled, perpsCacheKey]);

  if (!enabled) {
    return { status: 'idle' };
  }

  return settled?.perpsCacheKey === perpsCacheKey
    ? settled.balance
    : { status: 'loading' };
}

/**
 * Blocking alert when the entered amount exceeds the HL withdrawable balance.
 *
 * This hook is wired into `useTransactionAlerts`, which runs for every
 * confirmation type, so the fresh account-state read is gated on the
 * confirmation actually being a `perpsWithdraw`: sends, swaps and contract
 * interactions never touch Perps.
 */
export function usePerpsWithdrawInsufficientBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  // `useTransactionCustomAmount` owns local state, so a second call here
  // would never see input. `amountFiat` is what the user typed in USD;
  // `amountUsd` is token-count × $1 and drifts for non-1:1 stables.
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);
  const freshBalance = useFreshPerpsWithdrawableBalance(isPerpsWithdraw);
  const enteredAmountFiat = primaryRequiredToken?.amountFiat ?? '0';

  const exceedsBalance = useMemo(() => {
    if (!isPerpsWithdraw) {
      return false;
    }

    const enteredAmount = new BigNumber(enteredAmountFiat);
    if (!enteredAmount.gt(0)) {
      return false;
    }

    if (freshBalance.status === 'loaded') {
      return exceedsPerpsWithdrawBalance(
        enteredAmount,
        new BigNumber(freshBalance.balance),
      );
    }

    // Degraded read: block rather than approve an amount we could not verify.
    // The provider would reject it anyway.
    if (freshBalance.status === 'unavailable') {
      return true;
    }

    // Idle or still in flight: nothing to compare against yet, and blocking
    // here would flag a valid withdrawal for as long as the read runs.
    return false;
  }, [enteredAmountFiat, freshBalance, isPerpsWithdraw]);

  return useMemo(() => {
    if (!exceedsBalance) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: AlertsName.InsufficientPayTokenBalance,
        message: t('alertInsufficientPayTokenBalance'),
        reason: t('alertInsufficientPayTokenBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [exceedsBalance, t]);
}

function exceedsPerpsWithdrawBalance(
  enteredAmount: BigNumber,
  availableBalance: BigNumber,
): boolean {
  if (!enteredAmount.gt(0)) {
    return false;
  }

  if (!availableBalance.gt(0)) {
    return true;
  }

  return enteredAmount
    .round(PERPS_WITHDRAW_AMOUNT_DECIMALS, BigNumber.ROUND_DOWN)
    .gt(
      availableBalance.round(
        PERPS_WITHDRAW_AMOUNT_DECIMALS,
        BigNumber.ROUND_DOWN,
      ),
    );
}
