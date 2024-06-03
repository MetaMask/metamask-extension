import { useMemo } from 'react';
import useBlockaidAlerts from './alerts/useBlockaidAlert';

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();

  return useMemo(() => [...blockaidAlerts], [blockaidAlerts]);
};

export default useConfirmationAlerts;
