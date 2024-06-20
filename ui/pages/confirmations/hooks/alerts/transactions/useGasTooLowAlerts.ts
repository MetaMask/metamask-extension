import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MIN_GAS_LIMIT_DEC } from '../../../send/send.constants';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../selectors';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';

export function useGasTooLowAlerts(): Alert[] {
  const t = useI18nContext();

  const currentConfirmation = useSelector(currentConfirmationSelector) as
    | TransactionMeta
    | undefined;

  const gas = currentConfirmation?.txParams?.gas;

  const gasTooLow =
    gas && Number(hexToDecimal(gas)) < Number(MIN_GAS_LIMIT_DEC);

  return useMemo(() => {
    if (!gasTooLow) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowAdvancedGasFeeModal,
            label: t('alertActionUpdateGas'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'gasTooLow',
        message: t('alertMessageGasTooLow'),
        reason: t('alertReasonGasTooLow'),
        severity: Severity.Warning,
      },
    ];
  }, [gasTooLow]);
}
