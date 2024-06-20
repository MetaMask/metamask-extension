import { useMemo } from 'react';
import {
  isValidSIWEOrigin,
  WrappedSIWERequest
} from '@metamask/controller-utils';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../types/confirm';
import { isSIWESignatureRequest } from '../../utils';
import useCurrentConfirmation from '../useCurrentConfirmation';

export default function useDomainMismatchAlerts(): Alert[] {
  const { currentConfirmation } = useCurrentConfirmation();
  const t = useI18nContext();

  const isSIWE = isSIWESignatureRequest(
    currentConfirmation as SignatureRequestType
  );
  if (!isSIWE || !currentConfirmation?.msgParams) {
    return [];
  }

  const { msgParams } = currentConfirmation;
  const isValidDomain = isValidSIWEOrigin(msgParams as WrappedSIWERequest);
  if (isValidDomain) {
    return [];
  }

  return [{
    field: 'requestFrom',
    key: 'requestFrom',
    message: t('confirmAlertModalMessageDomainMismatch'),
    reason: t('confirmAlertModalTitleSignIn'),
    severity: Severity.Danger,
  }];
};

