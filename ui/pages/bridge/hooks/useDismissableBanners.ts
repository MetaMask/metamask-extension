import { useCallback, useMemo, useState } from 'react';
import { type BridgeAlert } from '../prepare/types';

export const useDismissableAlerts = (tokenAlerts: BridgeAlert[]) => {
  // Only store dismissals; visibility is derived so alert-set changes do not
  // require render-time setState. Compare by ids — `bannerAlerts` is often a
  // new array each render.
  const tokenAlertsKey = tokenAlerts.map((alert) => alert.id).join('|');
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [dismissedForKey, setDismissedForKey] = useState(tokenAlertsKey);

  const alertVisibility = useMemo(() => {
    const activeDismissedIds =
      dismissedForKey === tokenAlertsKey ? dismissedIds : new Set<string>();
    return tokenAlerts.reduce(
      (acc, { id, isDismissable }) => {
        if (!isDismissable) {
          return acc;
        }
        acc[id] = !activeDismissedIds.has(id);
        return acc;
      },
      {} as { [key: string]: boolean },
    );
  }, [tokenAlerts, tokenAlertsKey, dismissedForKey, dismissedIds]);

  const dismissAlert = useCallback(
    (id: string) => {
      setDismissedForKey(tokenAlertsKey);
      setDismissedIds((prev) => {
        const base =
          dismissedForKey === tokenAlertsKey ? prev : new Set<string>();
        const next = new Set<string>(base);
        next.add(id);
        return next;
      });
    },
    [tokenAlertsKey, dismissedForKey],
  );

  return {
    /** A map of token warning IDs to their visibility state */
    alertVisibility,
    /** A function to hide a token warning banner */
    dismissAlert,
  };
};
