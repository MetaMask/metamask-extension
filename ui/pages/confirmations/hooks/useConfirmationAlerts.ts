import { useMemo } from 'react';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import useSignatureAlerts from './alerts/useSignatureAlerts';

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();
  const signatureAlerts = useSignatureAlerts();

  return useMemo(
    () => [...blockaidAlerts, ...signatureAlerts],
    [blockaidAlerts, signatureAlerts],
  );
};

export default useConfirmationAlerts;
