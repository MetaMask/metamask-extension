import { TransactionMeta } from '@metamask/transaction-controller';
import useCurrentConfirmation from '../../useCurrentConfirmation';
import { MIN_GAS_LIMIT_DEC } from '../../../send/send.constants';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';
import { useMemo } from 'react';
import { t } from '../../../../../../app/scripts/translate';
import { Severity } from '../../../../../helpers/constants/design-system';

export function useGasTooLowAlerts() {
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
