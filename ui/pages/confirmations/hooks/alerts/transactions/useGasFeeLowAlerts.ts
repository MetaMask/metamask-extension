import { useMemo } from 'react';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { Severity } from '../../../../../helpers/constants/design-system';
import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';

export function useGasFeeLowAlerts(): Alert[] {
  const t = useI18nContext();
  const { estimateUsed } = useGasFeeContext() as any;
  const isLowEstimate = estimateUsed === PriorityLevels.low;

  return useMemo(() => {
    if (!isLowEstimate) {
      return [];
    }

    return [
      {
        field: 'estimatedFee',
        key: 'gasFeeLow',
        message: t('lowPriorityMessage'),
        reason: 'Low Gas Fee',
        severity: Severity.Warning,
      },
    ];
  }, [isLowEstimate]);
}
