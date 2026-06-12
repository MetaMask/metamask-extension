import { useCallback, useEffect, useState } from 'react';
import { type BridgeAlert } from '../prepare/types';

export const useDismissableAlerts = (tokenAlerts: BridgeAlert[]) => {
  // Track the visibility of each alert
  const [alertVisibility, setAlertVisibility] = useState<{
    [key: string]: boolean;
  }>({});
  // Reset the alert visibility when new alerts are found
  useEffect(
    () =>
      setAlertVisibility(
        tokenAlerts.reduce(
          (acc, { id, isDismissable }) => {
            if (!isDismissable) {
              return acc;
            }
            acc[id] = true;
            return acc;
          },
          {} as { [key: string]: boolean },
        ),
      ),
    [tokenAlerts],
  );

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
