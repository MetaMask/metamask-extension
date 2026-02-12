import { Severity } from '../../helpers/constants/design-system';
import confirmAlertsReducer, {
  updateAlerts,
  setAlertConfirmed,
  clearAlerts,
  Alert,
} from './confirm-alerts';

describe('confirmAlertsReducer', () => {
  const ownerIdMocked = '123';
  const ownerId2Mocked = '321';
  const ownerId3Mocked = '000';
  const alertsMocked: Alert[] = [
    {
      key: 'from',
      severity: Severity.Warning,
      message: 'Alert 1',
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
      isBlocking: true,
    },
    {
      key: 'to',
      severity: Severity.Danger,
      message: 'Alert 2',
      isBlocking: false,
      actions: [{ key: 'action', label: 'Action' }],
    },
  ];
  const initialState = {
    alerts: {
      [ownerIdMocked]: alertsMocked,
      [ownerId2Mocked]: alertsMocked,
      [ownerId3Mocked]: alertsMocked,
    },
    confirmed: {
      [ownerIdMocked]: {
        from: false,
        to: false,
      },
      [ownerId2Mocked]: {
        from: false,
        to: false,
      },
    },
  };

  it('handles UPDATE_ALERTS action', () => {
    const updatedAlerts = {
      ...initialState.alerts,
      [ownerIdMocked]: [
        ...initialState.alerts[ownerIdMocked],
        { ...alertsMocked[0], key: 'from2' },
      ],
    };
    const action = updateAlerts(ownerIdMocked, updatedAlerts[ownerIdMocked]);

    const expectedState = {
      ...initialState,
      alerts: updatedAlerts,
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });

  it('handles SET_ALERT_CONFIRMED action', () => {
    const alertKey = 'to';
    const isConfirmed = true;
    const action = setAlertConfirmed(ownerId2Mocked, alertKey, isConfirmed);

    const expectedState = {
      ...initialState,
      confirmed: {
        ...initialState.confirmed,
        [ownerId2Mocked]: {
          ...initialState.confirmed[ownerId2Mocked],
          [alertKey]: isConfirmed,
        },
      },
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });

  it('handles CLEAR_ALERTS action', () => {
    const action = clearAlerts(ownerIdMocked);

    const expectedState = {
      ...initialState,
      alerts: {
        ...initialState.alerts,
        [ownerIdMocked]: [],
      },
      confirmed: {
        ...initialState.confirmed,
        [ownerIdMocked]: {},
      },
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });
});
