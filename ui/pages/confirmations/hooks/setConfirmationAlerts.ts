import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import {
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { currentConfirmationSelector } from '../../../selectors';
import useBlockaidAlerts from './alerts/useBlockaidAlert';

const setConfirmationAlerts = () => {
  const dispatch = useDispatch();
  // todo: currently we are showing only blockaid alerts
  // more will be added to this list
  const alerts = useBlockaidAlerts();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const ownerId = currentConfirmation?.id as string;

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
