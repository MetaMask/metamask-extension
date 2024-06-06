import { useSelector } from 'react-redux';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { getNoGasPriceFetched, selectTransactionMetadata } from '../../../../../selectors';
import useCurrentConfirmation from '../../useCurrentConfirmation';
import { TransactionMeta, UserFeeLevel } from '@metamask/transaction-controller';
import { txParamsAreDappSuggested } from '../../../../../../shared/modules/transaction.utils';
import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function useNoGasPriceAlerts(): Alert[] {
  const t = useI18nContext();
  const {currentConfirmation} = useCurrentConfirmation();
  const transaction = (currentConfirmation ?? {}) as TransactionMeta;
  const { id: transactionId } = transaction;
  const transactionMeta = useSelector((state) => selectTransactionMetadata(state, transactionId));
  const isCustomGasPrice = transactionMeta?.userFeeLevel === UserFeeLevel.CUSTOM || txParamsAreDappSuggested(transactionMeta);
  const isNoGasPriceFetched = useSelector(getNoGasPriceFetched);
  const noGasPrice = true;

  return useMemo(() => {
    if (!noGasPrice) {
      return [];
    }

    return [
      {
        field: 'estimatedFee',
        isBlocking: true,
        key: 'noGasPrice',
        message: t('gasPriceFetchFailed'),
        reason: 'No Gas Price',
        severity: Severity.Danger,
      },
    ];
  }, [noGasPrice]);
}
