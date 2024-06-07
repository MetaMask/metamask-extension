import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useSelector } from 'react-redux';
import { getIsUsingPaymaster } from '../../../../../selectors/account-abstraction';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';

export function usePaymasterAlerts(): Alert[] {
  const t = useI18nContext();
  const isUsingPaymaster = useSelector(getIsUsingPaymaster);

  return useMemo(() => {
    if (!isUsingPaymaster) {
      return [];
    }

    return [
      {
        field: 'estimatedFee',
        key: 'usingPaymaster',
        message: t('paymasterInUse'),
        reason: 'Using Paymaster',
        severity: Severity.Info,
      },
    ];
  }, [isUsingPaymaster]);
}
