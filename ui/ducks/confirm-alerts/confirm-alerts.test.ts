import { Severity } from '../../helpers/constants/design-system';
import confirmAlertsReducer, {
  updateAlerts,
  setAlertConfirmed,
  clearAlerts,
  Alert,
} from './confirm-alerts';

describe('confirmAlertsReducer', () => {
  const initialState = {
    alerts: {},
    confirmed: {},
  };

  const ownerIdMocked = '123';

  it('should handle UPDATE_ALERTS action', () => {
    const alerts: Alert[] = [
      {
        key: 'from',
        severity: Severity.Warning,
        message: 'Alert 1',
        reason: 'Reason 1',
        alertDetails: ['Detail 1', 'Detail 2'],
      },
      { key: 'to', severity: Severity.Danger, message: 'Alert 2' },
    ];
    const action = updateAlerts(ownerIdMocked, alerts);

    const expectedState = {
      alerts: {
        [ownerIdMocked]: alerts,
      },
      confirmed: {},
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle SET_ALERT_CONFIRMED action', () => {
    const alertKey = '1';
    const isConfirmed = true;
    const action = setAlertConfirmed(ownerIdMocked, alertKey, isConfirmed);

    const expectedState = {
      alerts: {},
      confirmed: {
        [ownerIdMocked]: {
          [alertKey]: isConfirmed,
        },
      },
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle CLEAR_ALERTS action', () => {
    const action = clearAlerts(ownerIdMocked);

    const expectedState = {
      alerts: {
        [ownerIdMocked]: [],
      },
      confirmed: {
        [ownerIdMocked]: {},
      },
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });
});
