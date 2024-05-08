import { ApprovalType } from '@metamask/controller-utils';
import { useMemo } from 'react';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { PersonalSignAlertAction } from './PersonalSignAlertActions';

const usePersonalSignAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();

  const alerts = useMemo<Alert[]>(() => {
    if (currentConfirmation?.type !== ApprovalType.PersonalSign) {
      return [];
    }

    console.log('usePersonalSignAlerts returning alerts >', currentConfirmation)

    return [
      {
        key: 'message',
        severity: Severity.Warning,
        message: `Test 1 - ${(currentConfirmation.id as string)?.slice(0, 3)}`,
      },
      {
        key: 'fieldTest1',
        field: 'from',
        severity: Severity.Info,
        message: 'Test 2',
      },
      {
        key: 'fieldTest2',
        field: 'from',
        severity: Severity.Danger,
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
