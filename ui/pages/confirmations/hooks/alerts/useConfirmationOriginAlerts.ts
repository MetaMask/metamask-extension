import { useMemo } from 'react';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isValidASCIIURL, toPunycodeURL } from '../../utils/confirm';
import { useApprovalRequest } from '../useApprovalRequest';

const useConfirmationOriginAlerts = (): Alert[] => {
  const t = useI18nContext();
  const currentConfirmation = useApprovalRequest();
  const origin = currentConfirmation?.origin;

  const originUndefinedOrValid =
    origin === undefined || origin === 'metamask' || isValidASCIIURL(origin);

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
