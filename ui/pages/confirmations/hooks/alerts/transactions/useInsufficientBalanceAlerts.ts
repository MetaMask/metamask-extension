import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  selectTransactionAvailableBalance,
  selectTransactionFeeById,
  selectTransactionValue,
} from '../../../../../selectors';
import { isBalanceSufficient } from '../../../send/send.utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';

export function useInsufficientBalanceAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { id: transactionId } = currentConfirmation ?? {};

  const balance = useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId),
  );

  const value = useSelector((state) =>
    selectTransactionValue(state, transactionId),
  );

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const insufficientBalance = !isBalanceSufficient({
    amount: value,
    gasTotal: hexMaximumTransactionFee,
    balance,
  });

  return useMemo(() => {
    if (!insufficientBalance) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.Buy,
            label: t('alertActionBuy'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'insufficientBalance',
        message: t('alertMessageInsufficientBalance'),
        reason: t('alertReasonInsufficientBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [insufficientBalance]);
}
