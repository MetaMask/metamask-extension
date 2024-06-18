import { useMemo } from 'react';
import { isValidSIWEOrigin, WrappedSIWERequest } from '@metamask/controller-utils';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../types/confirm';
import { isSIWESignatureRequest } from '../../utils';
import useCurrentConfirmation from '../useCurrentConfirmation';

const useSignatureAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();
  const t = useI18nContext();

  const alerts = useMemo<Alert[]>(() => {
    const isSIWE = isSIWESignatureRequest(currentConfirmation as SignatureRequestType);
    if (!isSIWE || !currentConfirmation?.msgParams) {
      return [];
    }

    const isSIWEDomainValid = isValidSIWEOrigin(currentConfirmation.msgParams as WrappedSIWERequest);
    if (isSIWEDomainValid) {
      return [];
    }

    const alert = {
      field: 'requestFrom',
      key: 'requestFrom',
      message: t('confirmAlertModalMessageDomainMismatch'),
      reason: t('confirmAlertModalTitleSignIn'),
      severity: Severity.Danger,
    } as Alert;

    return [alert];
  }, [currentConfirmation?.id, currentConfirmation?.msgParams, t]);

  return alerts;
};

export default useSignatureAlerts;
