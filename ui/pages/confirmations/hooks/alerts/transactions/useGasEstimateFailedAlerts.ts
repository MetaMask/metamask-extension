import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import {
  currentConfirmationSelector,
  selectTransactionMetadata,
} from '../../../../../selectors';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  const { id: transactionId } = (currentConfirmation ?? {}) as TransactionMeta;

  const transactionMetadata = useSelector((state) =>
    selectTransactionMetadata(state, transactionId),
  );

  const estimationFailed = Boolean(transactionMetadata?.simulationFails);

  return useMemo(() => {
    if (!estimationFailed) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.UpdateGas,
            label: t('alertActionUpdateGas'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        message: t('simulationErrorMessageV2'),
        reason: t('alertReasonGasEstimateFailed'),
        severity: Severity.Danger,
      },
    ];
  }, [estimationFailed]);
}
