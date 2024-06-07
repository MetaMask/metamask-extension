import { useSelector } from 'react-redux';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { currentConfirmationSelector, getNoGasPriceFetched, selectTransactionMetadata } from '../../../../../selectors';
import useCurrentConfirmation from '../../useCurrentConfirmation';
import { TransactionMeta, UserFeeLevel } from '@metamask/transaction-controller';
import { txParamsAreDappSuggested } from '../../../../../../shared/modules/transaction.utils';
import { useMemo } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';

export function useNoGasPriceAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const transaction = (currentConfirmation ?? {}) as TransactionMeta;
  const { id: transactionId } = transaction;
  const transactionMeta = useSelector((state) => selectTransactionMetadata(state, transactionId));
  const isCustomGasPrice = transactionMeta?.userFeeLevel === UserFeeLevel.CUSTOM || txParamsAreDappSuggested(transactionMeta);
  const isNoGasPriceFetched = useSelector(getNoGasPriceFetched);
  const noGasPrice = !isCustomGasPrice && isNoGasPriceFetched;

  return useMemo(() => {
    if (!noGasPrice) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'noGasPrice',
        message: t('gasPriceFetchFailed'),
        reason: 'No Gas Price',
        severity: Severity.Danger,
      },
    ];
  }, [noGasPrice]);
}
