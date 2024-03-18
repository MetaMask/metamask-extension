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

  it('should handle UPDATE_ALERTS action', () => {
    const ownerId = '123';
    const alerts: Alert[] = [
      { key: '1', severity: Severity.Warning, message: 'Alert 1' },
      { key: '2', severity: Severity.Danger, message: 'Alert 2' },
    ];
    const action = updateAlerts(ownerId, alerts);

    const expectedState = {
      alerts: {
        [ownerId]: alerts,
      },
      confirmed: {},
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle SET_ALERT_CONFIRMED action', () => {
    const ownerId = '123';
    const alertKey = '1';
    const isConfirmed = true;
    const action = setAlertConfirmed(ownerId, alertKey, isConfirmed);

    const expectedState = {
      alerts: {},
      confirmed: {
        [ownerId]: {
          [alertKey]: isConfirmed,
        },
      },
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle CLEAR_ALERTS action', () => {
    const ownerId = '123';
    const action = clearAlerts(ownerId);

    const expectedState = {
      alerts: {
        [ownerId]: [],
      },
      confirmed: {
        [ownerId]: {},
      },
    };

    expect(confirmAlertsReducer(initialState, action)).toEqual(expectedState);
  });
});
