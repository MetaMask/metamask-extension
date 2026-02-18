import { useEffect, useState } from 'react';
<<<<<<< HEAD
import type { PerpsControllerState } from '@metamask/perps-controller';
import { usePerpsController } from '../../providers/perps/PerpsControllerProvider';
=======
import { usePerpsController } from '../../providers/perps';
>>>>>>> main

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
<<<<<<< HEAD
  const [isEligible, setIsEligible] = useState(controller.state.isEligible);

  useEffect(() => {
    setIsEligible(controller.state.isEligible);
=======
  const [isEligible, setIsEligible] = useState(true); // TODO: hook up to live controller

  useEffect(() => {
    setIsEligible(true); // TODO: hook up to live controller
>>>>>>> main

    const controllerWithMessenger = controller as typeof controller & {
      messenger: {
        subscribe: (
          event: string,
<<<<<<< HEAD
          handler: (state: PerpsControllerState) => void,
=======
          handler: (state: unknown) => void,
>>>>>>> main
        ) => () => void;
      };
    };
    const unsubscribe = controllerWithMessenger.messenger.subscribe(
      'PerpsController:stateChange',
<<<<<<< HEAD
      (state: PerpsControllerState) => {
        setIsEligible(state.isEligible);
=======
      () => {
        setIsEligible(true); // TODO: hook up with live controller
>>>>>>> main
      },
    );
    return unsubscribe;
  }, [controller]);

  return { isEligible };
}
