import type { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';

import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';

export function useResimulationAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const isUpdatedAfterSecurityCheck = (currentConfirmation as TransactionMeta)
    ?.simulationData?.isUpdatedAfterSecurityCheck;

  return useMemo(() => {
    if (!isUpdatedAfterSecurityCheck) {
      return [];
    }

    return [
      {
        actions: [],
        field: RowAlertKey.Resimulation,
        isBlocking: false,
        key: 'simulationDetailsTitle',
        message: t('alertMessageChangeInSimulationResults'),
        reason: t('alertReasonChangeInSimulationResults'),
        severity: Severity.Danger,
      },
    ];
  }, [isUpdatedAfterSecurityCheck, t]);
}
