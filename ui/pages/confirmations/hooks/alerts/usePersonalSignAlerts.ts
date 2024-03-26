import { ApprovalType } from '@metamask/controller-utils';
import { useMemo } from 'react';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { PersonalSignAlertAction } from './usePersonalSignAlertActions';

const usePersonalSignAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();

  const alerts = useMemo<Alert[]>(() => {
    if (currentConfirmation?.type !== ApprovalType.PersonalSign) {
      return [];
    }

    return [
      {
        key: 'wideTest1',
        severity: 'warning',
        message: `Test 1 - ${(currentConfirmation.id as string)?.slice(0, 3)}`,
      },
      {
        key: 'fieldTest1',
        field: 'from',
        severity: 'alert',
        message: 'Test 2',
      },
      {
        key: 'fieldTest2',
        field: 'from',
        severity: 'alert',
        message: 'Test 3',
        actions: [
          { key: PersonalSignAlertAction.GoToPage, label: 'Redirect Test' },
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
