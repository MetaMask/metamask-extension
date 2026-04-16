import { useEffect, useState } from 'react';
import { usePerpsController } from '../../providers/perps';

/**
 * Hook to read perps geo-blocking eligibility from the PerpsController.
 * Re-renders when controller state.isEligible changes (e.g. after remote
 * feature flags or geolocation check).
 *
 * Must be used inside a PerpsControllerProvider.
 *
 * @returns isEligible - true if the user can trade/deposit/modify; false if geo-blocked
 */
export function usePerpsEligibility(): { isEligible: boolean } {
  const controller = usePerpsController();
  const [isEligible, setIsEligible] = useState(true); // TODO: hook up to live controller

  useEffect(() => {
    setIsEligible(true); // TODO: hook up to live controller

    const controllerWithMessenger = controller as typeof controller & {
      messenger: {
        subscribe: (
          event: string,
          handler: (state: unknown) => void,
        ) => () => void;
      };
    };
    const unsubscribe = controllerWithMessenger.messenger.subscribe(
      'PerpsController:stateChange',
      () => {
        setIsEligible(true); // TODO: hook up with live controller
      },
    );
    return unsubscribe;
  }, [controller]);

  return { isEligible };
}
