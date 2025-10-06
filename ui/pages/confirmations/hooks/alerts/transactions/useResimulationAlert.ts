import { useMemo } from 'react';

import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useUnapprovedTransaction } from '../../transactions/useUnapprovedTransaction';

export function useResimulationAlert(): Alert[] {
  const t = useI18nContext();
  const transactionMeta = useUnapprovedTransaction();

  const isUpdatedAfterSecurityCheck =
    transactionMeta?.simulationData?.isUpdatedAfterSecurityCheck;

  const isWalletInitiated = transactionMeta?.origin === ORIGIN_METAMASK;

  return useMemo(() => {
    if (!isUpdatedAfterSecurityCheck || isWalletInitiated) {
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
  }, [isUpdatedAfterSecurityCheck, isWalletInitiated, t]);
}
