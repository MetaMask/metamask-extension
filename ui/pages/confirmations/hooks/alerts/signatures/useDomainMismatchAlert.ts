import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  isValidSIWEOrigin,
  WrappedSIWERequest,
} from '@metamask/controller-utils';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';

import { SignatureRequestType } from '../../../types/confirm';
import { isSIWESignatureRequest } from '../../../utils';

export default function useDomainMismatchAlerts(): Alert[] {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;
  const { msgParams } = currentConfirmation;

  const isSIWE = isSIWESignatureRequest(currentConfirmation);
  const isInvalidDomain = !isValidSIWEOrigin(msgParams as WrappedSIWERequest);

  const alerts = useMemo(() => {
    if (!isSIWE || !isInvalidDomain) {
      return [];
    }

    return [
      {
        field: 'requestFrom',
        key: 'requestFrom',
        message: t('alertMessageSignInDomainMismatch'),
        reason: t('alertReasonSignIn'),
        severity: Severity.Danger,
      },
    ] as Alert[];
  }, [isSIWE, isInvalidDomain, t]);

  return alerts;
}
