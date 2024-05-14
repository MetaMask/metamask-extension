import { useMemo } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { SecurityAlertResponse } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { providerAlertNormalizer } from '../../../../components/app/confirmations/alerts/utils';
import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import { PersonalSignAlertAction } from './PersonalSignAlertActions';

const usePersonalSignAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();
  const t = useI18nContext();

  const alerts = useMemo<Alert[]>(() => {
    if (
      currentConfirmation?.type !== ApprovalType.PersonalSign ||
      !currentConfirmation?.securityAlertResponse
    ) {
      return [];
    }

    const securityAlertResponse =
      currentConfirmation.securityAlertResponse as SecurityAlertResponse;

    if (
      !securityAlertResponse.securityAlertId ||
      securityAlertResponse.reason === BlockaidResultType.Loading
    ) {
      return [];
    }
    return [
      providerAlertNormalizer(securityAlertResponse, t),
      {
        key: 'Message',
        field: 'Message',
        severity: Severity.Danger,
        message: `Test 1 - ${(currentConfirmation.id as string)?.slice(0, 3)}`,
      },
      // {
      //   key: 'fieldTest1',
      //   severity: Severity.Danger,
      //   message: 'Test 2',
      //   reason: 'Test Reason',
      //   alertDetails: ['Detail 1 of the alert', 'Detail 2 of the alert'],
      // },
      // {
      //   key: 'fieldTest2',
      //   severity: Severity.Info,
      //   message: 'General Test 2',
      //   reason: 'General Test Reason 2',
      //   alertDetails: ['Detail 1 of the alert', 'Detail 2 of the alert'],
      // },
      {
        key: 'fieldTest3',
        field: 'from',
        severity: Severity.Info,
        message: 'Test 3',
        actions: [
          { key: PersonalSignAlertAction.GoToSwapPage, label: 'Redirect Test' },
          {
            key: PersonalSignAlertAction.DispatchAction,
            label: 'Dispatch Test',
          },
        ],
      },
    ];
  }, [currentConfirmation]);

  return alerts;
};

export default usePersonalSignAlerts;
