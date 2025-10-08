import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import useConfirmationAlerts from './useConfirmationAlerts';
import { useApprovalRequest } from './useApprovalRequest';

const useSetConfirmationAlerts = () => {
  const dispatch = useDispatch();
  const currentConfirmation = useApprovalRequest();
  const alerts = useConfirmationAlerts();
  const ownerId = currentConfirmation?.id as string;

  useEffect(() => {
    dispatch(updateAlerts(ownerId, alerts));
  }, [alerts, dispatch, ownerId]);

  useEffect(() => {
    return () => {
      dispatch(clearAlerts(ownerId));
    };
  }, []);
};

export default useSetConfirmationAlerts;
