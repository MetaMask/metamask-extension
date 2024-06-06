import { TransactionMeta } from '@metamask/transaction-controller';
import useCurrentConfirmation from '../../useCurrentConfirmation';
import { MIN_GAS_LIMIT_DEC } from '../../../send/send.constants';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';
import { useMemo } from 'react';
import { t } from '../../../../../../app/scripts/translate';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function useGasTooLowAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useCurrentConfirmation();
  const transaction = (currentConfirmation ?? {}) as TransactionMeta;
  const gas = transaction.txParams?.gas;

  const gasTooLow =
    gas && Number(hexToDecimal(gas)) < Number(MIN_GAS_LIMIT_DEC);

  return useMemo(() => {
    if (!gasTooLow) {
      return [];
    }

    return [
      {
        field: 'estimatedFee',
        isBlocking: true,
        key: 'gasTooLow',
        message: t('gasLimitTooLow'),
        reason: 'Low Gas',
        severity: Severity.Danger,
      },
    ];
  }, [gasTooLow]);
}
