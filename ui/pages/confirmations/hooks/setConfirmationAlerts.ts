import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../context/confirm';
import useConfirmationAlerts from './useConfirmationAlerts';

const setConfirmationAlerts = () => {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext();
  const alerts = useConfirmationAlerts();
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
