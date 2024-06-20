import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../selectors';
import { SecurityAlertResponse } from '../../types/confirm';
import { isSignatureTransactionType } from '../../utils';
import { normalizeProviderAlert } from './utils';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

const useBlockaidAlerts = (): Alert[] => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const securityAlertResponse =
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse;

  const signatureSecurityAlertResponse = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses?.[
        securityAlertResponse?.securityAlertId as string
      ],
  );

  const alerts = useMemo<Alert[]>(() => {
    if (!isSignatureTransactionType(currentConfirmation)) {
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

    return [normalizeProviderAlert(signatureSecurityAlertResponse, t)];
  }, [currentConfirmation, signatureSecurityAlertResponse]);

  return alerts;
};

export default useBlockaidAlerts;
