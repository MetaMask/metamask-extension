import type { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';

import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const estimationFailed = Boolean(currentConfirmation?.simulationFails);

  return useMemo(() => {
    if (!estimationFailed) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowAdvancedGasFeeModal,
            label: t('alertActionUpdateGas'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        message: t('alertMessageGasEstimateFailed'),
        reason: t('alertReasonGasEstimateFailed'),
        severity: Severity.Warning,
      },
    ];
  }, [estimationFailed]);
}
