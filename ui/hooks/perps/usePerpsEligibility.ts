import { useEffect, useState } from 'react';
import type { PerpsControllerState } from '@metamask/perps-controller';
import { usePerpsController } from '../../providers/perps/PerpsControllerProvider';

/**
 * Hook to read perps geo-blocking eligibility from the PerpsController.
 * Re-renders when controller state.isEligible changes (e.g. after remote
 * feature flags or geolocation check).
 *
 * @returns isEligible - true if the user can trade/deposit/modify; false if geo-blocked
 * @returns isLoading - false (eligibility is resolved asynchronously in the controller)
 */
export function usePerpsEligibility(): {
  isEligible: boolean;
  isLoading: boolean;
} {
  const controller = usePerpsController();
  const [isEligible, setIsEligible] = useState(controller.state.isEligible);

  useEffect(() => {
    setIsEligible(controller.state.isEligible);

    const controllerWithMessenger = controller as typeof controller & {
      messenger: {
        subscribe: (
          event: string,
          handler: (state: PerpsControllerState) => void,
        ) => () => void;
      };
    };
    const unsubscribe = controllerWithMessenger.messenger.subscribe(
      'PerpsController:stateChange',
      (state: PerpsControllerState) => setIsEligible(state.isEligible),
    );
    return unsubscribe;
  }, [controller]);

  return { isEligible, isLoading: false };
}
