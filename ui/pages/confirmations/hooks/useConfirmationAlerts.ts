import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useQueuedConfirmationsAlerts from './alerts/transactions/useQueuedConfirmationsAlerts';
import useBlockaidAlerts from './alerts/useBlockaidAlert';

function useConfirmationAlerts(): Alert[] {
  const blockaidAlerts = useBlockaidAlerts();
  const queuedConfirmationsAlerts = useQueuedConfirmationsAlerts();

  return useMemo(
    () => [...blockaidAlerts, ...queuedConfirmationsAlerts],
    [blockaidAlerts, queuedConfirmationsAlerts],
  );
}

export default useConfirmationAlerts;
