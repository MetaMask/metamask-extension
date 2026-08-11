import { useCallback, useState } from 'react';
import { type BridgeAlert } from '../prepare/types';

const buildAlertVisibility = (tokenAlerts: BridgeAlert[]) =>
  tokenAlerts.reduce(
    (acc, { id, isDismissable }) => {
      if (!isDismissable) {
        return acc;
      }
      acc[id] = true;
      return acc;
    },
    {} as { [key: string]: boolean },
  );

export const useDismissableAlerts = (tokenAlerts: BridgeAlert[]) => {
  // Track the visibility of each alert
  const [alertVisibility, setAlertVisibility] = useState<{
    [key: string]: boolean;
  }>(() => buildAlertVisibility(tokenAlerts));

  // Reset when the alert *set* changes. Compare by ids — `bannerAlerts` is often
  // a new array each render and object `!==` would reset visibility every time.
  const tokenAlertsKey = tokenAlerts.map((alert) => alert.id).join('|');
  const [prevTokenAlertsKey, setPrevTokenAlertsKey] = useState(tokenAlertsKey);
  if (tokenAlertsKey !== prevTokenAlertsKey) {
    setPrevTokenAlertsKey(tokenAlertsKey);
    setAlertVisibility(buildAlertVisibility(tokenAlerts));
  }

  const dismissAlert = useCallback(
    (id: string) =>
      setAlertVisibility((prev) => {
        const visibility = { ...prev };
        visibility[id] = false;
        return visibility;
      }),
    [],
  );

  return {
    /** A map of token warning IDs to their visibility state */
    alertVisibility,
    /** A function to hide a token warning banner */
    dismissAlert,
  };
};
