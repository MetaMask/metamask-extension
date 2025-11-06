import { useMemo } from 'react';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { LOWER_CASED_BURN_ADDRESSES } from '../../../constants/token';
import {
  useTransferRecipient,
  useNestedTransactionTransferRecipients,
} from '../../../components/confirm/info/hooks/useTransferRecipient';

export function useBurnAddressAlert(): Alert[] {
  const t = useI18nContext();
  const transactionMetaRecipient = useTransferRecipient();
  const nestedTransactionRecipients = useNestedTransactionTransferRecipients();

  const hasBurnAddressRecipient = useMemo(() => {
    const hasBurnAddressInTransactionMetaRecipient =
      LOWER_CASED_BURN_ADDRESSES.includes(
        transactionMetaRecipient?.toLowerCase() ?? '',
      );
    const hasBurnAddressNestedTransactionRecipient =
      nestedTransactionRecipients.some((recipient) =>
        LOWER_CASED_BURN_ADDRESSES.includes(recipient.toLowerCase()),
      );

    return (
      hasBurnAddressInTransactionMetaRecipient ||
      hasBurnAddressNestedTransactionRecipient
    );
  }, [transactionMetaRecipient, nestedTransactionRecipients]);

  return useMemo(() => {
    if (!hasBurnAddressRecipient) {
      return [];
    }

    return [
      {
        key: AlertActionKey.InteractingWith,
        field: RowAlertKey.InteractingWith,
        message: t('alertMessageBurnAddress'),
        reason: t('alertActionBurnAddress'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [hasBurnAddressRecipient]);
}
