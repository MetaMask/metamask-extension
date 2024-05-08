import { useMemo } from 'react';
import usePersonalSignAlerts from './alerts/usePersonalSignAlerts';

const useConfirmationAlerts = () => {
  const personalSignAlerts = usePersonalSignAlerts();
  console.log('useConfirmationAlerts alerts.length >', personalSignAlerts.length)

  return useMemo(() => [...personalSignAlerts], [personalSignAlerts]);
};

export default useConfirmationAlerts;
