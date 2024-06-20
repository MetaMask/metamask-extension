import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import useDomainMismatchAlerts from './alerts/signatures/useDomainMismatchAlert';

function useSignatureAlerts(): Alert[] {
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return useMemo(() => [...domainMismatchAlerts], [domainMismatchAlerts]);
}

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();
  const signatureAlerts = useSignatureAlerts();

  return useMemo(
    () => [...blockaidAlerts, ...signatureAlerts],
    [blockaidAlerts, signatureAlerts],
  );
};

export default useConfirmationAlerts;
