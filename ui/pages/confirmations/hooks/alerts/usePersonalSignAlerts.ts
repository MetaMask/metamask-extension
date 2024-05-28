import { useMemo } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { useSelector } from 'react-redux';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { SecurityAlertResponse } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import { providerAlertNormalizer } from './utils';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

const usePersonalSignAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();
  const t = useI18nContext();
  const securityAlertResponse =
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse;

  const signatureSecurityAlertResponse = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses?.[
        securityAlertResponse?.securityAlertId as string
      ],
  );

  const alerts = useMemo<Alert[]>(() => {
    if (currentConfirmation?.type !== ApprovalType.PersonalSign) {
      return [];
    }

    if (
      !signatureSecurityAlertResponse ||
      [BlockaidResultType.Benign, BlockaidResultType.Loading].includes(
        signatureSecurityAlertResponse?.result_type as BlockaidResultType,
      )
    ) {
      return [];
    }

    return [providerAlertNormalizer(signatureSecurityAlertResponse, t)];
  }, [currentConfirmation, signatureSecurityAlertResponse]);

  return alerts;
};

export default usePersonalSignAlerts;
