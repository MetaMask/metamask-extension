'use no memo';

import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useEstimationFailed } from '../../gas/useEstimationFailed';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext();
  const estimationFailed = useEstimationFailed();

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
