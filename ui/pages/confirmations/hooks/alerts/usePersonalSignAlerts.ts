import { useMemo } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { SecurityAlertResponse } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { providerAlertNormalizer } from '../../../../components/app/alerts-system/utils';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
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

    return [
      providerAlertNormalizer(securityAlertResponse, t),
      {
        key: 'Message',
        field: 'Message',
        severity: Severity.Danger,
        message: `Test 1 - Message is a pishing attempt. Please do not sign this message.`,
        reason: 'Test Reason',
        alertDetails: ['Detail 1 of the alert', 'Detail 2 of the alert'],
        provider: SecurityProvider.Blockaid,
      },
      {
        key: 'fieldTest1',
        severity: Severity.Danger,
        message: 'Test 2',
        reason: 'Test Reason',
        alertDetails: ['Detail 1 of the alert', 'Detail 2 of the alert'],
      },
      {
        key: 'fieldTest2',
        field: 'testField',
        severity: Severity.Info,
        message: 'General Test 2',
        reason: 'General Test Reason 2',
        alertDetails: ['Detail 1 of the alert', 'Detail 2 of the alert'],
      },
      {
        key: 'fieldTest3',
        field: 'from',
        severity: Severity.Warning,
        message: 'Test 3',
        actions: [
          {
            key: 'dispatchAction',
            label: 'Update gas option',
          },
        ],
      },
    ];
  }, [currentConfirmation, signatureSecurityAlertResponse]);

  return alerts;
};

export default usePersonalSignAlerts;
