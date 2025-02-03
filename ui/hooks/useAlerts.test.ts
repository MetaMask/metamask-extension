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

  const renderAndReturnResult = (
    ownerId?: string,
    state?: { confirmAlerts: ConfirmAlertsState },
  ) => {
    return renderHookUseAlert(ownerId, state).result;
  };

  describe('alerts', () => {
    it('returns all alerts', () => {
      const result = renderAndReturnResult();
      expect(result.current.alerts).toEqual(alertsMock);
      expect(result.current.hasAlerts).toEqual(true);
      expect(result.current.hasDangerAlerts).toEqual(true);
      expect(result.current.hasUnconfirmedDangerAlerts).toEqual(false);
    });

    it('returns alerts ordered by severity', () => {
      const result = renderAndReturnResult();
      const orderedAlerts = result.current.alerts;
      expect(orderedAlerts[0].severity).toEqual(Severity.Danger);
    });
  });

  describe('unconfirmedDangerAlerts', () => {
    it('returns all unconfirmed danger alerts', () => {
      const result = renderAndReturnResult(undefined, {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: alertsMock,
            [ownerId2Mock]: [alertsMock[0]],
          },
          confirmed: {},
        },
      });
      expect(result.current.hasAlerts).toEqual(true);
      expect(result.current.hasUnconfirmedDangerAlerts).toEqual(true);
      expect(result.current.unconfirmedDangerAlerts).toHaveLength(1);
    });
  });

  describe('unconfirmedFieldDangerAlerts', () => {
    it('returns all unconfirmed field danger alerts', () => {
      const result = renderAndReturnResult(undefined, {
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
      expect(result.current.unconfirmedFieldDangerAlerts).toEqual([
        expectedFieldDangerAlert,
      ]);
    });
  });

  describe('hasUnconfirmedFieldDangerAlerts', () => {
    it('returns true if there are unconfirmed field danger alerts', () => {
      const result = renderAndReturnResult(undefined, {
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
      expect(result.current.hasUnconfirmedFieldDangerAlerts).toEqual(true);
    });

    it('returns false if there are no unconfirmed field danger alerts', () => {
      const result = renderAndReturnResult(undefined, {
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
      expect(result.current.hasUnconfirmedFieldDangerAlerts).toEqual(false);
    });
  });

  describe('generalAlerts', () => {
    it('returns general alerts sorted by severity', () => {
      const warningGeneralAlert = {
        key: dataAlertKeyMock,
        severity: Severity.Warning as AlertSeverity,
        message: 'Alert 2',
      };
      const expectedGeneralAlerts = [
        {
          ...warningGeneralAlert,
          severity: Severity.Info as AlertSeverity,
          message: 'Alert 3',
          key: fromAlertKeyMock,
        },
        {
          ...warningGeneralAlert,
          severity: Severity.Danger as AlertSeverity,
          message: 'Alert 1',
          key: toAlertKeyMock,
        },
        warningGeneralAlert,
      ];

      const result = renderAndReturnResult(undefined, {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: expectedGeneralAlerts,
          },
          confirmed: {},
        },
      });

      expect(result.current.generalAlerts).toEqual(expectedGeneralAlerts);
    });
  });

  describe('getFieldAlerts', () => {
    const expectedFieldAlerts = alertsMock.find(
      (alert) => alert.field === fromAlertKeyMock,
    );
    it('returns all alert filtered by field property', () => {
      const result = renderAndReturnResult();
      expect(result.current.getFieldAlerts(fromAlertKeyMock)).toEqual([
        expectedFieldAlerts,
      ]);
    });

    it('returns empty array if field is not provided', () => {
      const result = renderAndReturnResult();
      expect(result.current.getFieldAlerts()).toEqual([]);
    });

    it('returns empty array, when no alert for specified field', () => {
      const result = renderAndReturnResult();
      expect(result.current.getFieldAlerts('mockedField')).toEqual([]);
    });
  });

  describe('fieldAlerts', () => {
    it('returns all alerts with field property', () => {
      const result = renderAndReturnResult();
      expect(result.current.fieldAlerts).toEqual([
        alertsMock[0],
        alertsMock[2],
      ]);
    });

    it('returns empty array if no alerts with field property', () => {
      const result = renderAndReturnResult('mockedOwnerId');
      expect(result.current.fieldAlerts).toEqual([]);
    });
  });

  describe('isAlertConfirmed', () => {
    it('returns an if an alert is confirmed', () => {
      const result = renderAndReturnResult();
      expect(result.current.isAlertConfirmed(fromAlertKeyMock)).toBe(true);
    });

    it('returns an if an alert is not confirmed', () => {
      const result = renderAndReturnResult(ownerId2Mock);
      expect(result.current.isAlertConfirmed(fromAlertKeyMock)).toBe(false);
    });
  });

  describe('setAlertConfirmed', () => {
    it('dismisses alert confirmation', () => {
      const result = renderAndReturnResult();
      result.current.setAlertConfirmed(fromAlertKeyMock, false);
      expect(result.current.isAlertConfirmed(fromAlertKeyMock)).toBe(false);
    });
    it('confirms an alert', () => {
      const result = renderAndReturnResult(ownerId2Mock);
      result.current.setAlertConfirmed(fromAlertKeyMock, true);
      expect(result.current.isAlertConfirmed(fromAlertKeyMock)).toBe(true);
    });
  });
});
