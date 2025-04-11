import type { ApprovalRequest } from '@metamask/approval-controller';
import { useDispatch } from 'react-redux';
import { useEffect, useMemo } from 'react';

import type {
  Alert} from '../../../../ducks/confirm-alerts/confirm-alerts';
import {
  clearAlerts,
  updateAlerts,
} from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useUpdateEthereumChainAlerts } from './useUpdateEthereumChainAlerts';

export const useTemplateConfirmationAlerts = (
  pendingConfirmation: ApprovalRequest<{ id: string }>,
) => {
  const dispatch = useDispatch();
  const addEthereumChainAlerts =
    useUpdateEthereumChainAlerts(pendingConfirmation);
  const alerts: Alert[] = useMemo(
    () => addEthereumChainAlerts,
    [addEthereumChainAlerts],
  );
  const alertOwnerId = pendingConfirmation?.id;

  useEffect(() => {
    dispatch(updateAlerts(alertOwnerId, alerts));
  }, [alerts, alertOwnerId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearAlerts(alertOwnerId));
    };
  }, [alertOwnerId, dispatch]);
};
