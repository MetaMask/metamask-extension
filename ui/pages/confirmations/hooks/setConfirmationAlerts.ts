import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { currentConfirmationSelector } from '../../../selectors';
// import { useAlertSystemMetrics } from '../../../components/app/alert-system/useAlertSystemMetrics';
import useConfirmationAlerts from './useConfirmationAlerts';

const setConfirmationAlerts = () => {
  const dispatch = useDispatch();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const alerts = useConfirmationAlerts();
  const ownerId = currentConfirmation?.id as string;
  // const type = currentConfirmation?.type;
  // useAlertSystemMetrics({ ownerId, type });

  useEffect(() => {
    dispatch(updateAlerts(ownerId, alerts));
  }, [alerts, ownerId]);

  useEffect(() => {
    return () => {
      dispatch(clearAlerts(ownerId));
    };
  }, []);
};

export default setConfirmationAlerts;
