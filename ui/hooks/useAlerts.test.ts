import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  Alert,
  AlertSeverity,
  ConfirmAlertsState,
} from '../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../helpers/constants/design-system';
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

  const sortBySeverityDesc = (alerts: Alert[]) => {
    const severityOrder = {
      [Severity.Danger]: 3,
      [Severity.Warning]: 2,
      [Severity.Info]: 1,
      [Severity.Success]: 0,
      [Severity.Disabled]: 0,
    };

    return [...alerts].sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
    );
  };

  describe('alerts', () => {
    it('returns all alerts', () => {
      const result = renderAndReturnResult();
      const expectedAlerts = sortBySeverityDesc(alertsMock);
      expect(result.current.alerts).toEqual(expectedAlerts);
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

      const expectedSortedGeneralAlerts = sortBySeverityDesc(
        expectedGeneralAlerts,
      );
      expect(result.current.generalAlerts).toEqual(expectedSortedGeneralAlerts);
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
      const expectedFieldAlerts = sortBySeverityDesc(
        [alertsMock[0], alertsMock[2]].filter(
          (alert) => typeof alert !== 'undefined',
        ) as Alert[],
      );
      expect(result.current.fieldAlerts).toEqual(expectedFieldAlerts);
    });

    it('returns empty array if no alerts with field property', () => {
      const result = renderAndReturnResult('mockedOwnerId');
      expect(result.current.fieldAlerts).toEqual([]);
    });
  });

  describe('navigable alerts', () => {
    it('excludes alerts that hide from alert navigation', () => {
      const hiddenFieldAlertKey = 'hidden-field';
      const generalAlertKey = 'general';
      const hiddenGeneralAlertKey = 'hidden-general';

      const fieldVisibleAlert = {
        key: fromAlertKeyMock,
        field: fromAlertKeyMock,
        severity: Severity.Danger as AlertSeverity,
        message: 'Visible Field Alert',
      };
      const fieldHiddenAlert = {
        key: hiddenFieldAlertKey,
        field: fromAlertKeyMock,
        severity: Severity.Warning as AlertSeverity,
        message: 'Hidden Field Alert',
        hideFromAlertNavigation: true,
      };
      const generalVisibleAlert = {
        key: generalAlertKey,
        severity: Severity.Info as AlertSeverity,
        message: 'Visible General Alert',
      };
      const generalHiddenAlert = {
        key: hiddenGeneralAlertKey,
        severity: Severity.Success as AlertSeverity,
        message: 'Hidden General Alert',
        hideFromAlertNavigation: true,
      };

      const state = {
        confirmAlerts: {
          alerts: {
            [ownerIdMock]: [
              fieldVisibleAlert,
              fieldHiddenAlert,
              generalVisibleAlert,
              generalHiddenAlert,
            ],
          },
          confirmed: {},
        },
      };

      const result = renderAndReturnResult(undefined, state);

      expect(
        result.current.navigableAlerts.map(({ key }: Alert) => key),
      ).toEqual([fieldVisibleAlert.key, generalVisibleAlert.key]);
      expect(
        result.current.navigableFieldAlerts.map(({ key }: Alert) => key),
      ).toEqual([fieldVisibleAlert.key]);
      expect(
        result.current.navigableGeneralAlerts.map(({ key }: Alert) => key),
      ).toEqual([generalVisibleAlert.key]);
      expect(
        result.current
          .getNavigableFieldAlerts(fromAlertKeyMock)
          .map(({ key }: Alert) => key),
      ).toEqual([fieldVisibleAlert.key]);
      expect(result.current.getNavigableFieldAlerts('unknown')).toEqual([]);
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
