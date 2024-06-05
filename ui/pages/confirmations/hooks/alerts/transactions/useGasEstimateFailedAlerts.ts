import { TransactionMeta } from '@metamask/transaction-controller';
import useCurrentConfirmation from '../../useCurrentConfirmation';
import { useSelector } from 'react-redux';
import { selectTransactionMetadata } from '../../../../../selectors';
import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function useGasEstimateFailedAlerts() {
  const { currentConfirmation } = useCurrentConfirmation();
  const transaction = (currentConfirmation ?? {}) as TransactionMeta;
  const { id: transactionId } = transaction;

  const transactionMetadata = useSelector((state) =>
    selectTransactionMetadata(state, transactionId),
  );

  const estimationFailed = Boolean(transactionMetadata?.simulationFails);

  const t = useI18nContext();

  return useMemo(() => {
    if (!estimationFailed) {
      return [];
    }

    return [
      {
        field: 'estimatedFee',
        key: 'gasEstimateFailed',
        message: t('simulationErrorMessageV2'),
        reason: 'Gas Estimation Failed',
        severity: Severity.Danger,
      },
    ];
  }, [estimationFailed]);
}
