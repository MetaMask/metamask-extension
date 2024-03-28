import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  AlertsState,
  selectAlerts,
  selectConfirmedAlertKeys,
  selectGeneralAlerts,
} from '../selectors/alerts';
import {
  Alert,
  setAlertConfirmed as setAlertConfirmedAction,
} from '../ducks/confirm-alerts/confirm-alerts';

const useAlerts = (ownerId: string) => {
  const dispatch = useDispatch();

  const alerts: Alert[] = useSelector((state) =>
    selectAlerts(state as AlertsState, ownerId),
  );

  const confirmedAlertKeys = useSelector((state) =>
    selectConfirmedAlertKeys(state as AlertsState, ownerId),
  );

  const generalAlerts = useSelector((state) =>
    selectGeneralAlerts(state as AlertsState, ownerId),
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

  return {
    alerts,
    generalAlerts,
    getFieldAlerts,
    setAlertConfirmed,
    isAlertConfirmed,
  };
};

export default useAlerts;
