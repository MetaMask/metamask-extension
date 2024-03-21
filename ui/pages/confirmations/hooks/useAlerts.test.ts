import { Severity } from '../../../helpers/constants/design-system';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import useAlerts from './useAlerts';

describe('useAlerts', () => {
  const ownerIdMock = '123';
  const fromAlertKeyMock = 'from';
  const dataAlertKeyMock = 'data';
  const alertsMock = [
    {
      key: fromAlertKeyMock,
      field: fromAlertKeyMock,
      severity: Severity.Danger,
      message: 'Alert 1',
    },
    { key: dataAlertKeyMock, severity: Severity.Warning, message: 'Alert 2' },
  ];

  const mockState = {
    confirmAlerts: {
      alerts: { [ownerIdMock]: alertsMock },
      confirmed: {
        [ownerIdMock]: { [fromAlertKeyMock]: true, [dataAlertKeyMock]: false },
      },
    },
  };

  describe('returns the correct', () => {
    const expectedGeneralAlerts = alertsMock.find(
      (alert) => alert.key === dataAlertKeyMock,
    );
    const expectedFieldAlerts = alertsMock.find(
      (alert) => alert.field === fromAlertKeyMock,
    );
    const { result } = renderHookWithProvider(
      () => useAlerts(ownerIdMock),
      mockState,
    );

    it('alerts', () => {
      expect(result.current.alerts).toEqual(alertsMock);
    });

    it('generalAlerts', () => {
      expect(result.current.generalAlerts).toEqual([expectedGeneralAlerts]);
    });

    it('getFieldAlerts', () => {
      expect(result.current.getFieldAlerts(fromAlertKeyMock)).toEqual([
        expectedFieldAlerts,
      ]);
    });

    it('isAlertConfirmed', () => {
      expect(result.current.isAlertConfirmed(fromAlertKeyMock)).toBe(true);
    });
  });
});
