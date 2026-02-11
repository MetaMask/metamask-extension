import { useEffect, useState } from 'react';
import type { PerpsControllerState } from '@metamask/perps-controller';
import { usePerpsControllerOrNull } from '../../providers/perps/PerpsControllerProvider';

const DEFAULT_ELIGIBLE = true;

/**
 * Hook to read perps geo-blocking eligibility from the PerpsController.
 * Re-renders when controller state.isEligible changes (e.g. after remote
 * feature flags or geolocation check).
 *
 * When the controller is not available (e.g. outside PerpsControllerProvider
 * or before stream manager has initialized), returns isEligible: true so
 * the UI is not incorrectly blocked.
 *
 * @returns isEligible - true if the user can trade/deposit/modify; false if geo-blocked
 * @returns isLoading - false (eligibility is resolved asynchronously in the controller)
 */
export function usePerpsEligibility(): {
  isEligible: boolean;
  isLoading: boolean;
} {
  const controller = usePerpsControllerOrNull();
  const [isEligible, setIsEligible] = useState(
    controller?.state.isEligible ?? DEFAULT_ELIGIBLE,
  );

  useEffect(() => {
    if (!controller) {
      setIsEligible(DEFAULT_ELIGIBLE);
      return undefined;
    }

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
      (state: PerpsControllerState) => {
        setIsEligible(state.isEligible);
      },
    );
    return unsubscribe;
  }, [controller]);

  return {
    isEligible: controller ? isEligible : DEFAULT_ELIGIBLE,
    isLoading: false,
  };
}
