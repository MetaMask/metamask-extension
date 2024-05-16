import { useMemo } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { SecurityAlertResponse } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { providerAlertNormalizer } from '../../../../components/app/confirmations/alerts/utils';
import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import useSignatureSecurityAlertResponse from '../useSignatureSecurityAlertResponse';

const usePersonalSignAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();
  const t = useI18nContext();
  const securityAlertResponse =
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse;

  const signatureSecurityAlertResponse = useSignatureSecurityAlertResponse(
    securityAlertResponse?.securityAlertId,
  );

  const alerts = useMemo<Alert[]>(() => {
    if (currentConfirmation?.type !== ApprovalType.PersonalSign) {
      return [];
    }

    if (
      !signatureSecurityAlertResponse ||
      signatureSecurityAlertResponse?.reason === BlockaidResultType.Loading
    ) {
      return [];
    }

    return [providerAlertNormalizer(securityAlertResponse, t)];
  }, [currentConfirmation, signatureSecurityAlertResponse]);

  return alerts;
};

export default usePersonalSignAlerts;
