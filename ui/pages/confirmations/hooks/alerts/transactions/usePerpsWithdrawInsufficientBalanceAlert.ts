'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';
import { getPerpsStreamManager } from '../../../../../providers/perps';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

const PERPS_WITHDRAW_AMOUNT_DECIMALS = 6;

/**
 * Blocking alert when the entered amount exceeds the HL withdrawable balance.
 *
 * This hook is wired into `useTransactionAlerts`, which runs for every
 * confirmation type. To avoid `usePerpsLiveAccount` triggering a `perpsInit`
 * RPC (and an `api.hyperliquid.xyz` request) on every non-perps confirmation
 * — sends, contract interactions, swaps, etc. — we read the account directly
 * from the `PerpsStreamManager` singleton's cache, and only when the
 * confirmation actually is a `perpsWithdraw`. The Perps Withdraw confirmation
 * itself renders `PerpsWithdrawBalance`, which subscribes via
 * `usePerpsLiveAccount` and keeps the singleton's cache fresh, so our render-
 * time read sees up-to-date data by the time the user can enter an amount.
 */
export function usePerpsWithdrawInsufficientBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  // `useTransactionCustomAmount` owns local state, so a second call here
  // would never see input. `amountFiat` is what the user typed in USD;
  // `amountUsd` is token-count × $1 and drifts for non-1:1 stables.
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  // Side-effect-free read from the singleton — does NOT trigger init.
  const account = isPerpsWithdraw
    ? getPerpsStreamManager().account.getCachedData()
    : null;

  const availableBalance = new BigNumber(getTradeableBalance(account));
  const enteredAmount = new BigNumber(primaryRequiredToken?.amountFiat ?? '0');

  const exceedsBalance =
    isPerpsWithdraw &&
    exceedsPerpsWithdrawBalance(enteredAmount, availableBalance);

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
