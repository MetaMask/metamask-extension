import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { Severity } from '../../../../../helpers/constants/design-system';
import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { currentConfirmationSelector } from '../../../selectors';

export function useGasFeeLowAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { id: transactionId } = (currentConfirmation ?? {}) as TransactionMeta;

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
        field: RowAlertKey.EstimatedFee,
        key: 'gasFeeLow',
        message: t('lowPriorityMessage'),
        reason: 'Low Gas Fee',
        severity: Severity.Warning,
      },
    ];
  }, [isLowEstimate]);
}
