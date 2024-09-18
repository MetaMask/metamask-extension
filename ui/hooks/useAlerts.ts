import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  AlertsState,
  selectAlerts,
  selectConfirmedAlertKeys,
  selectFieldAlerts,
  selectGeneralAlerts,
} from '../selectors/alerts';
import {
  Alert,
  setAlertConfirmed as setAlertConfirmedAction,
} from '../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../helpers/constants/design-system';

const useAlerts = (ownerId: string) => {
  const dispatch = useDispatch();

  const alerts: Alert[] = sortAlertsBySeverity(
    useSelector((state) => selectAlerts(state as AlertsState, ownerId)),
  );

  const confirmedAlertKeys = useSelector((state) =>
    selectConfirmedAlertKeys(state as AlertsState, ownerId),
  );

  const generalAlerts = useSelector((state) =>
    selectGeneralAlerts(state as AlertsState, ownerId),
  );

  const fieldAlerts = sortAlertsBySeverity(
    useSelector((state) => selectFieldAlerts(state as AlertsState, ownerId)),
  );

  const getFieldAlerts = useCallback(
    (field: string | undefined) => {
      if (!field) {
        return [];
      }

      return alerts.filter((alert) => alert.field === field);
    },
    [alerts],
  );

  const setAlertConfirmed = useCallback(
    (alertKey: string, isConfirmed: boolean) => {
      dispatch(setAlertConfirmedAction(ownerId, alertKey, isConfirmed));
    },
    [dispatch, setAlertConfirmedAction, ownerId],
  );

  const isAlertConfirmed = useCallback(
    (alertKey: string) => {
      return confirmedAlertKeys.includes(alertKey);
    },
    [confirmedAlertKeys],
  );

  const unconfirmedDangerAlerts = alerts.filter(
    (alert) =>
      !isAlertConfirmed(alert.key) && alert.severity === Severity.Danger,
  );
  const hasAlerts = alerts.length > 0;
  const dangerAlerts = alerts.filter(
    (alert) => alert.severity === Severity.Danger,
  );
  const hasUnconfirmedDangerAlerts = unconfirmedDangerAlerts.length > 0;

  return {
    alerts,
    fieldAlerts,
    generalAlerts,
    getFieldAlerts,
    hasAlerts,
    dangerAlerts,
    hasDangerAlerts: dangerAlerts?.length > 0,
    hasUnconfirmedDangerAlerts,
    isAlertConfirmed,
    setAlertConfirmed,
    unconfirmedDangerAlerts,
  };
};

function sortAlertsBySeverity(alerts: Alert[]): Alert[] {
  const severityOrder = {
    [Severity.Danger]: 3,
    [Severity.Warning]: 2,
    [Severity.Info]: 1,
  };

  return alerts.sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
  );
}

export default useAlerts;
