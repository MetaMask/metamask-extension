import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Confirmation, SignatureRequestType } from '../../types/confirm';
import { currentConfirmationSelector } from '../../selectors';
import { isValidASCIIURL, toPunycodeURL } from '../../utils/confirm';
import { isSignatureTransactionType } from '../../utils';

const useConfirmationOriginAlerts = (): Alert[] => {
  const t = useI18nContext();

  const currentConfirmation: Confirmation | undefined = useSelector(
    currentConfirmationSelector,
  );

  return useMemo<Alert[]>((): Alert[] => {
    if (!currentConfirmation) {
      return [];
    }

    const origin = isSignatureTransactionType(currentConfirmation)
      ? (currentConfirmation as SignatureRequestType).msgParams?.origin
      : (currentConfirmation as TransactionMeta).origin;

    // if (origin && isValidASCIIURL(origin)) {
    //   return [];
    // }

    return [
      {
        key: 'originSpecialCharacterWarning',
        reason: t('addressMismatch'),
        field: 'requestFrom',
        severity: Severity.Warning,
        message: t('alertMessageAddressMismatchWarning'),
        alertDetails: [
          t('addressMismatchOriginal', [origin]),
          t('addressMismatchPunycode', [origin ? toPunycodeURL(origin) : '']),
        ],
      },
    ];
  }, [currentConfirmation, t]);
};

export default useConfirmationOriginAlerts;
