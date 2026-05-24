'use no memo';

import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';

export function useGasFeeLowAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const transaction = currentConfirmation as TransactionMeta | undefined;

  const isLowEstimate = transaction?.userFeeLevel === PriorityLevels.low;

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
