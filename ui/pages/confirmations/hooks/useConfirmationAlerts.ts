import { useMemo } from 'react';
import usePersonalSignAlerts from './alerts/usePersonalSignAlerts';

const useConfirmationAlerts = () => {
  const personalSignAlerts = usePersonalSignAlerts();

  return useMemo(() => [...personalSignAlerts], [personalSignAlerts]);
};

export default useConfirmationAlerts;
