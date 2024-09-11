import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../types/confirm';
import { isValidASCIIURL, toPunycodeURL } from '../../utils/confirm';
import { isSignatureTransactionType } from '../../utils';
import { useConfirmContext } from '../../context/confirm';

const useConfirmationOriginAlerts = (): Alert[] => {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext();

  const origin = isSignatureTransactionType(currentConfirmation)
    ? (currentConfirmation as SignatureRequestType)?.msgParams?.origin
    : (currentConfirmation as TransactionMeta)?.origin;

  const originUndefinedOrValid =
    origin === undefined || isValidASCIIURL(origin);

  return useMemo<Alert[]>((): Alert[] => {
    if (originUndefinedOrValid) {
      return [];
    }

    return [
      {
        key: 'originSpecialCharacterWarning',
        reason: t('addressMismatch'),
        field: RowAlertKey.RequestFrom,
        severity: Severity.Warning,
        message: t('alertMessageAddressMismatchWarning'),
        alertDetails: [
          t('addressMismatchOriginal', [origin]),
          t('addressMismatchPunycode', [origin ? toPunycodeURL(origin) : '']),
        ],
      },
    ];
  }, [origin, originUndefinedOrValid, t]);
};

export default useConfirmationOriginAlerts;
