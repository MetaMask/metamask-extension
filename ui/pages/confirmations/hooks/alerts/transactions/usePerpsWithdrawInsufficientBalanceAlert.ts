'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionCustomAmount } from '../../transactions/useTransactionCustomAmount';
import { AlertsName } from '../constants';

/**
 * Alert raised on the Perps Withdraw confirmation when the user enters an
 * amount greater than the available HyperLiquid balance.
 *
 * Blocks the confirm button via `isBlocking: true`, mirroring the mobile
 * `perpsWithdrawInsufficient` behavior (CONF-1217).
 */
export function usePerpsWithdrawInsufficientBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { account } = usePerpsLiveAccount();
  const { amountFiat } = useTransactionCustomAmount();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  // HyperLiquid Unified Account mode keeps USDC collateral in the spot
  // clearinghouse, so `availableBalance` reads $0 — would false-positive the
  // insufficient-balance alert and block legitimate withdrawals. Use the
  // unified `availableToTradeBalance` via `getTradeableBalance`. Mirrors mobile
  // fix in metamask-mobile#29492.
  const availableBalance = new BigNumber(getTradeableBalance(account));
  const enteredAmount = new BigNumber(amountFiat || '0');

  const exceedsBalance =
    isPerpsWithdraw &&
    enteredAmount.gt(0) &&
    enteredAmount.gt(availableBalance);

  return useMemo(() => {
    if (!exceedsBalance) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: AlertsName.InsufficientPayTokenBalance,
        message: t('perpsWithdrawInsufficient'),
        reason: t('perpsWithdrawInvalidAmount'),
        severity: Severity.Danger,
      },
    ];
  }, [exceedsBalance, t]);
}
