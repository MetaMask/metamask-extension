import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  currentConfirmationSelector,
  getNoGasPriceFetched,
  selectTransactionMetadata,
} from '../../../../../selectors';
import { txParamsAreDappSuggested } from '../../../../../../shared/modules/transaction.utils';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';

export function useNoGasPriceAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { id: transactionId } = (currentConfirmation ?? {}) as TransactionMeta;

  const transactionMeta = useSelector((state) =>
    selectTransactionMetadata(state, transactionId),
  );

  const isCustomGasPrice =
    transactionMeta?.userFeeLevel === UserFeeLevel.CUSTOM ||
    txParamsAreDappSuggested(transactionMeta);

  const isNoGasPriceFetched = useSelector(getNoGasPriceFetched);

  const noGasPrice =
    transactionMeta && !isCustomGasPrice && isNoGasPriceFetched;

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
        reason: t('alertReasonNoGasPrice'),
        severity: Severity.Danger,
      },
    ];
  }, [noGasPrice]);
}
