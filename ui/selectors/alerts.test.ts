import { Severity } from '../helpers/constants/design-system';
import {
  selectAlerts,
  selectGeneralAlerts,
  selectConfirmedAlertKeys,
  AlertsState,
  selectFieldAlerts,
} from './alerts';

describe('Alerts Selectors', () => {
  const ownerId1Mock = 'owner1';
  const ownerId2Mock = 'owner2';
  const ownerId3Mock = 'owner3';
  const mockedState = {
    confirmAlerts: {
      alerts: {
        [ownerId1Mock]: [
          {
            key: '1',
            severity: Severity.Danger,
            message: 'Alert 1',
            field: 'field1',
          },
          {
            key: '2',
            severity: Severity.Danger,
            message: 'Alert 2',
            field: 'field2',
          },
        ],
        [ownerId2Mock]: [
          {
            key: '3',
            severity: Severity.Danger,
            message: 'Alert 3',
            field: 'field3',
          },
          {
            key: '4',
            severity: Severity.Warning,
            message: 'Alert 4',
            field: 'field4',
          },
        ],
      },
      confirmed: {
        [ownerId1Mock]: {
          '1': true,
          '2': false,
        },
        [ownerId2Mock]: {
          '3': true,
          '4': true,
        },
      },
    },
  } as AlertsState;

  describe('selectAlerts', () => {
    it('returns alerts for a specific owner', () => {
      const alerts = selectAlerts(mockedState, ownerId1Mock);
      expect(alerts).toEqual(mockedState.confirmAlerts.alerts[ownerId1Mock]);
    });

    it('returns an empty array if owner has no alerts', () => {
      const alerts = selectAlerts(mockedState, ownerId3Mock);
      expect(alerts).toEqual([]);
    });
  });

  describe('selectGeneralAlerts', () => {
    it('returns general alerts for a specific owner', () => {
      const generalAlerts = selectGeneralAlerts(mockedState, ownerId1Mock);
      const expectedGeneralAlerts = mockedState.confirmAlerts.alerts[
        ownerId1Mock
      ].filter((alert) => !alert.field);

      expect(generalAlerts).toEqual(expectedGeneralAlerts);
    });

    it('returns an empty array if owner has no general alerts', () => {
      const generalAlerts = selectGeneralAlerts(mockedState, ownerId2Mock);
      expect(generalAlerts).toEqual([]);
    });
  });

  describe('selectConfirmedAlertKeys', () => {
    it('returns confirmed alert keys for a specific owner', () => {
      const confirmedAlertKeys = selectConfirmedAlertKeys(
        mockedState,
        ownerId2Mock,
      );
      expect(confirmedAlertKeys).toEqual(['3', '4']);
    });

    it('returns an empty array if owner has no confirmed alerts', () => {
      const confirmedAlertKeys = selectConfirmedAlertKeys(
        mockedState,
        ownerId3Mock,
      );
      expect(confirmedAlertKeys).toEqual([]);
    });
  });

  describe('selectFieldAlerts', () => {
    it('returns field alerts for a specific owner', () => {
      const fieldAlerts = selectFieldAlerts(mockedState, ownerId1Mock);
      const expectedFieldAlerts = mockedState.confirmAlerts.alerts[
        ownerId1Mock
      ].filter((alert) => alert.field);

      expect(fieldAlerts).toEqual(expectedFieldAlerts);
    });

    it('returns an empty array if owner has no field alerts', () => {
      const fieldAlerts = selectFieldAlerts(mockedState, 'no-alerts-owner-id');
      expect(fieldAlerts).toEqual([]);
    });
  });
});
