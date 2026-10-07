import { useEffect } from 'react';

import {
  type Alert,
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../context/confirm';
import { useDispatch } from '../../../store/hooks';
import useConfirmationAlerts from './useConfirmationAlerts';

const useSetConfirmationAlerts = (domainMismatchAlerts?: Alert[]) => {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext();
  const alerts = useConfirmationAlerts(domainMismatchAlerts);
  const ownerId = currentConfirmation?.id as string;

  useEffect(() => {
    dispatch(updateAlerts(ownerId, alerts));
  }, [alerts, ownerId]);

  useEffect(() => {
    return () => {
      dispatch(clearAlerts(ownerId));
    };
  }, [ownerId]);
};

export default useSetConfirmationAlerts;
