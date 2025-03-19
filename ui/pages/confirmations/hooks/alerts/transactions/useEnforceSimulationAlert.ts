import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useIsRedeemDelegationTransaction } from '../../useIsRedeemDelegationTransaction';

export function useEnforceSimulationAlert(): Alert[] {
  const t = useI18nContext();
  const isRedeemDelegationTransaction = useIsRedeemDelegationTransaction();

  return useMemo(() => {
    if (!isRedeemDelegationTransaction) {
      return [];
    }

    return [
      {
        key: 'enforceSimulation',
        message: t('alertMessageEnforceSimulation'),
        severity: Severity.Info,
      } as Alert,
    ];
  }, [isRedeemDelegationTransaction]);
}
