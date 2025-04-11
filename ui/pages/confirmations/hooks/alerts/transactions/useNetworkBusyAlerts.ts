import type { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { getIsNetworkBusyByChainId } from '../../../../../ducks/metamask/metamask';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';

export function useNetworkBusyAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isNetworkBusy = useSelector((state) =>
    getIsNetworkBusyByChainId(state, currentConfirmation?.chainId),
  );

  const showAlert = currentConfirmation?.chainId && isNetworkBusy;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        key: 'networkBusy',
        message: t('alertMessageNetworkBusy'),
        reason: t('alertReasonNetworkBusy'),
        severity: Severity.Warning,
      },
    ];
  }, [showAlert]);
}
