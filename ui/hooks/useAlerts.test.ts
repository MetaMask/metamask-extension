import { Severity } from '../helpers/constants/design-system';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  ConfirmAlertsState,
  AlertSeverity,
} from '../ducks/confirm-alerts/confirm-alerts';
import useAlerts from './useAlerts';

describe('useAlerts', () => {
  const ownerIdMock = '123';
  const ownerId2Mock = '321';
  const fromAlertKeyMock = 'from';
  const dataAlertKeyMock = 'data';
  const toAlertKeyMock = 'to';
  const alertsMock = [
    {
      key: toAlertKeyMock,
      field: toAlertKeyMock,
      severity: Severity.Info as AlertSeverity,
      message: 'Alert 3',
    },
    {
      key: dataAlertKeyMock,
      severity: Severity.Warning as AlertSeverity,
      message: 'Alert 2',
    },
    {
      key: fromAlertKeyMock,
      field: fromAlertKeyMock,
      severity: Severity.Danger as AlertSeverity,
      message: 'Alert 1',
    },
  ];

  const mockState = {
    confirmAlerts: {
      alerts: { [ownerIdMock]: alertsMock, [ownerId2Mock]: [alertsMock[0]] },
      confirmed: {
        [ownerIdMock]: {
          [fromAlertKeyMock]: true,
          [dataAlertKeyMock]: false,
          [toAlertKeyMock]: false,
        },
        [ownerId2Mock]: { [fromAlertKeyMock]: false },
      },
    },
  };

  const renderHookUseAlert = (
    ownerId?: string,
    state?: { confirmAlerts: ConfirmAlertsState },
  ) => {
    return renderHookWithProvider(
      () => useAlerts(ownerId ?? ownerIdMock),
      state ?? mockState,
    );
  };

  const { result } = renderHookUseAlert();

  describe('alerts', () => {
    it('returns all alerts', () => {
      expect(result.current.alerts).toEqual(alertsMock);
      expect(result.current.hasAlerts).toEqual(true);
      expect(result.current.hasDangerAlerts).toEqual(true);
      expect(result.current.hasUnconfirmedDangerAlerts).toEqual(false);
    });

    it('returns alerts ordered by severity', () => {
      const orderedAlerts = result.current.alerts;
      expect(orderedAlerts[0].severity).toEqual(Severity.Danger);
    });
  });

  describe('unconfirmedDangerAlerts', () => {
    it('returns all unconfirmed danger alerts', () => {
      const { result: result1 } = renderHookUseAlert(undefined, {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: alertsMock,
            [ownerId2Mock]: [alertsMock[0]],
          },
          confirmed: {},
        },
      });
      expect(result1.current.hasAlerts).toEqual(true);
      expect(result1.current.hasUnconfirmedDangerAlerts).toEqual(true);
      expect(result1.current.unconfirmedDangerAlerts).toHaveLength(1);
    });
  });

  describe('unconfirmedFieldDangerAlerts', () => {
    it('returns all unconfirmed field danger alerts', () => {
      const { result: result1 } = renderHookUseAlert(undefined, {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: alertsMock,
            [ownerId2Mock]: [alertsMock[0]],
          },
          confirmed: {
            [ownerIdMock]: {
              [fromAlertKeyMock]: false,
              [dataAlertKeyMock]: false,
              [toAlertKeyMock]: false,
            },
            [ownerId2Mock]: { [fromAlertKeyMock]: false },
          },
        },
      });
      const expectedFieldDangerAlert = alertsMock.find(
        (alert) =>
          alert.field === fromAlertKeyMock &&
          alert.severity === Severity.Danger,
      );
      expect(result1.current.unconfirmedFieldDangerAlerts).toEqual([
        expectedFieldDangerAlert,
      ]);
    });
  });

  describe('hasUnconfirmedFieldDangerAlerts', () => {
    it('returns true if there are unconfirmed field danger alerts', () => {
      const { result: result1 } = renderHookUseAlert(undefined, {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: alertsMock,
            [ownerId2Mock]: [alertsMock[0]],
          },
          confirmed: {
            [ownerIdMock]: {
              [fromAlertKeyMock]: false,
              [dataAlertKeyMock]: false,
              [toAlertKeyMock]: false,
            },
            [ownerId2Mock]: { [fromAlertKeyMock]: false },
          },
        },
      });
      expect(result1.current.hasUnconfirmedFieldDangerAlerts).toEqual(true);
    });

    it('returns false if there are no unconfirmed field danger alerts', () => {
      const { result: result1 } = renderHookUseAlert(undefined, {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: alertsMock,
            [ownerId2Mock]: [alertsMock[0]],
          },
          confirmed: {
            [ownerIdMock]: {
              [fromAlertKeyMock]: true,
              [dataAlertKeyMock]: false,
              [toAlertKeyMock]: false,
            },
            [ownerId2Mock]: { [fromAlertKeyMock]: false },
          },
        },
      });
      expect(result1.current.hasUnconfirmedFieldDangerAlerts).toEqual(false);
    });
  });

  describe('generalAlerts', () => {
    it('returns general alerts', () => {
      const expectedGeneralAlerts = alertsMock.find(
        (alert) => alert.key === dataAlertKeyMock,
      );
      expect(result.current.generalAlerts).toEqual([expectedGeneralAlerts]);
    });
  });

  describe('getFieldAlerts', () => {
    const expectedFieldAlerts = alertsMock.find(
      (alert) => alert.field === fromAlertKeyMock,
    );
    it('returns all alert filtered by field property', () => {
      expect(result.current.getFieldAlerts(fromAlertKeyMock)).toEqual([
        expectedFieldAlerts,
      ]);
    });

    it('returns empty array if field is not provided', () => {
      expect(result.current.getFieldAlerts()).toEqual([]);
    });

    it('returns empty array, when no alert for specified field', () => {
      expect(result.current.getFieldAlerts('mockedField')).toEqual([]);
    });
  });

  describe('fieldAlerts', () => {
    it('returns all alerts with field property', () => {
      expect(result.current.fieldAlerts).toEqual([
        alertsMock[0],
        alertsMock[2],
      ]);
    });

    it('returns empty array if no alerts with field property', () => {
      const { result: resultAlerts } = renderHookUseAlert('mockedOwnerId');
      expect(resultAlerts.current.fieldAlerts).toEqual([]);
    });
  });

  describe('isAlertConfirmed', () => {
    it('returns an if an alert is confirmed', () => {
      expect(result.current.isAlertConfirmed(fromAlertKeyMock)).toBe(true);
    });

    it('returns an if an alert is not confirmed', () => {
      const { result: resultAlerts } = renderHookUseAlert(ownerId2Mock);
      expect(resultAlerts.current.isAlertConfirmed(fromAlertKeyMock)).toBe(
        false,
      );
    });
  });

  describe('setAlertConfirmed', () => {
    it('dismisses alert confirmation', () => {
      const { result: resultAlerts } = renderHookUseAlert();
      resultAlerts.current.setAlertConfirmed(fromAlertKeyMock, false);
      expect(resultAlerts.current.isAlertConfirmed(fromAlertKeyMock)).toBe(
        false,
      );
    });
    it('confirms an alert', () => {
      const { result: resultAlerts } = renderHookUseAlert(ownerId2Mock);
      resultAlerts.current.setAlertConfirmed(fromAlertKeyMock, true);
      expect(resultAlerts.current.isAlertConfirmed(fromAlertKeyMock)).toBe(
        true,
      );
    });
  });
});
