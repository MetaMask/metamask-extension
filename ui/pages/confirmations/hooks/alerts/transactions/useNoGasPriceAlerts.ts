import type { TransactionMeta } from '@metamask/transaction-controller';
import { UserFeeLevel } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { txParamsAreDappSuggested } from '../../../../../../shared/modules/transaction.utils';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getNoGasPriceFetched } from '../../../../../selectors';
import { useConfirmContext } from '../../../context/confirm';

export function useNoGasPriceAlerts(): Alert[] {
  const t = useI18nContext();
  const isNoGasPriceFetched = useSelector(getNoGasPriceFetched);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isNotCustomGasPrice =
    currentConfirmation?.userFeeLevel &&
    currentConfirmation.userFeeLevel !== UserFeeLevel.CUSTOM &&
    !txParamsAreDappSuggested(currentConfirmation);

  const noGasPrice = isNotCustomGasPrice && isNoGasPriceFetched;

  return useMemo(() => {
    if (!noGasPrice) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowAdvancedGasFeeModal,
            label: t('alertActionUpdateGasFee'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'noGasPrice',
        message: t('alertMessageNoGasPrice'),
        reason: t('alertReasonNoGasPrice'),
        severity: Severity.Warning,
      },
    ];
  }, [noGasPrice]);
}
