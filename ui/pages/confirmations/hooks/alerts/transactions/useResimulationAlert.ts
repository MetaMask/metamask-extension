import { useMemo } from 'react';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';

export function useResimulationAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  if (!currentConfirmation) {
    return [];
  }

  const { simulationData } = currentConfirmation;
  const { isReSimulatedDueToSecurity } = simulationData;

  return useMemo(() => {
    if (!isReSimulatedDueToSecurity) {
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
  }, [isReSimulatedDueToSecurity]);
}
