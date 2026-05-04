'use no memo';

import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { RevertInfo } from '../../../components/revert-reason/revert-reason';
import { useConfirmContext } from '../../../context/confirm';
import { useEstimationFailed } from '../../gas/useEstimationFailed';
import { GasEstimateFailedAlertMessage } from './GasEstimateFailedAlertMessage';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext() as (key: string, ...args: unknown[]) => string;
  const estimationFailed = useEstimationFailed();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const revert: RevertInfo | undefined = currentConfirmation?.revert?.gas;

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
        content: GasEstimateFailedAlertMessage(t, revert),
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        reason: t('alertReasonGasEstimateFailed'),
        severity: Severity.Warning,
      },
    ];
  }, [estimationFailed, revert, t]);
}
