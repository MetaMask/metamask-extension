import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert,
  clearAlerts,
  updateAlerts,
} from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const useTemplateConfirmationAlerts = (alertOwnerId: string) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const alerts: Alert[] = useMemo(() => [], []);

  useEffect(() => {
    dispatch(updateAlerts(alertOwnerId, alerts));
  }, [alerts, alertOwnerId]);

  useEffect(() => {
    return () => {
      dispatch(clearAlerts(alertOwnerId));
    };
  }, []);
};
