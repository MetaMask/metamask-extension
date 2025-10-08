import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { Severity } from '../../../../../helpers/constants/design-system';
import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useUnapprovedTransactionWithFallback } from '../../transactions/useUnapprovedTransaction';

export function useGasFeeLowAlerts(): Alert[] {
  const t = useI18nContext();
  const { id: transactionId } = useUnapprovedTransactionWithFallback();

  const { estimateUsed, transaction } = useGasFeeContext() as {
    estimateUsed: PriorityLevels;
    transaction: TransactionMeta;
  };

  const isLowEstimate =
    transactionId === transaction?.id && estimateUsed === PriorityLevels.low;

  return useMemo(() => {
    if (!isLowEstimate) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowGasFeeModal,
            label: t('alertActionUpdateGasFeeLevel'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'gasFeeLow',
        message: t('alertMessageGasFeeLow'),
        reason: t('alertReasonGasFeeLow'),
        severity: Severity.Warning,
      },
    ];
  }, [isLowEstimate]);
}
