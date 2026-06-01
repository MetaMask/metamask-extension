import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSendContext } from '../../../context/send';
import { useTokenContractSendAlert } from './useTokenContractSendAlert';
import { useFirstTimeInteractionSendAlert } from './useFirstTimeInteractionSendAlert';
import type { SendAlert } from './types';

export function useSendAlerts(): {
  alerts: SendAlert[];
  hasUnacknowledgedAlerts: boolean;
  acknowledgeAlerts: () => void;
} {
  const { to } = useSendContext();
  const tokenContractAlert = useTokenContractSendAlert();
  const firstTimeAlert = useFirstTimeInteractionSendAlert();
  const [acknowledged, setAcknowledged] = useState(false);

  const alerts = useMemo(() => {
    const result: SendAlert[] = [];
    if (tokenContractAlert) {
      result.push(tokenContractAlert);
    }
    if (firstTimeAlert) {
      result.push(firstTimeAlert);
    }
    return result;
  }, [tokenContractAlert, firstTimeAlert]);

  useEffect(() => {
    setAcknowledged(false);
  }, [to]);

  const acknowledgeAlerts = useCallback(() => {
    setAcknowledged(true);
  }, []);

  const hasUnacknowledgedAlerts = alerts.length > 0 && !acknowledged;

  return {
    alerts,
    hasUnacknowledgedAlerts,
    acknowledgeAlerts,
  };
}
