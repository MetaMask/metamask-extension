import { useMemo } from 'react';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import useDomainMismatchAlerts from './alerts/useDomainMismatchAlert';

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return useMemo(
    () => [...blockaidAlerts, ...domainMismatchAlerts],
    [blockaidAlerts, domainMismatchAlerts],
  );
};

export default useConfirmationAlerts;
