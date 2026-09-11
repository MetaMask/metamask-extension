import { useCallback, useMemo, useState } from 'react';
import { useSendContext } from '../../../context/send';
import { useTokenContractSendAlert } from './useTokenContractSendAlert';
import { useFirstTimeInteractionSendAlert } from './useFirstTimeInteractionSendAlert';
import type { SendAlert } from './types';

export function useSendAlerts(): {
  alerts: SendAlert[];
  hasUnacknowledgedAlerts: boolean;
  acknowledgeAlerts: (keys?: string[]) => void;
} {
  const { to } = useSendContext();
  const tokenContractAlert = useTokenContractSendAlert();
  const firstTimeAlert = useFirstTimeInteractionSendAlert();
  const [acknowledgedKeys, setAcknowledgedKeys] = useState<string[]>([]);
  const [prevTo, setPrevTo] = useState(to);

  if (to !== prevTo) {
    setPrevTo(to);
    setAcknowledgedKeys([]);
  }

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

  const acknowledgeAlerts = useCallback(
    (keys?: string[]) => {
      const toAdd = keys ?? alerts.map((alert) => alert.key);
      if (toAdd.length === 0) {
        return;
      }
      setAcknowledgedKeys((prev) => {
        const merged = new Set(prev);
        toAdd.forEach((k) => merged.add(k));
        return Array.from(merged);
      });
    },
    [alerts],
  );

  const hasUnacknowledgedAlerts = alerts.some(
    (alert) => !acknowledgedKeys.includes(alert.key),
  );

  return {
    alerts,
    hasUnacknowledgedAlerts,
    acknowledgeAlerts,
  };
}
