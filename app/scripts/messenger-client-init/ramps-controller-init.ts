import {
  RampsController,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import type { OnboardingControllerState } from '../controllers/onboarding';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import type { MessengerClientInitFunction } from './types';
import { getRampsControllerApi } from './ramps-controller-api';
import type { RampsControllerInitMessenger } from './messengers/ramps-controller-messenger';

function shouldStartRampsLifecycle(
  initMessenger: RampsControllerInitMessenger,
): boolean {
  const { completedOnboarding } = initMessenger.call(
    'OnboardingController:getState',
  );
  const { useExternalServices } = initMessenger.call(
    'PreferencesController:getState',
  ) as Pick<PreferencesControllerState, 'useExternalServices'>;

  return completedOnboarding && Boolean(useExternalServices);
}

function createRampsLifecycleManager(messengerClient: RampsController) {
  let lifecycleStarted = false;

  const startRampsLifecycle = (): void => {
    if (lifecycleStarted) {
      return;
    }
    lifecycleStarted = true;

    messengerClient
      .init()
      .then(() => {
        messengerClient.startOrderPolling();
      })
      .catch((error) => {
        lifecycleStarted = false;
        console.error('RampsController failed to initialize', error);
      });
  };

  return { startRampsLifecycle };
}

function registerRampsLifecycleSubscriptions(
  initMessenger: RampsControllerInitMessenger,
  tryStartRampsLifecycle: () => void,
): void {
  initMessenger.subscribe(
    'OnboardingController:stateChange',
    (state: OnboardingControllerState) => {
      if (state.completedOnboarding) {
        tryStartRampsLifecycle();
      }
    },
  );

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    (state: PreferencesControllerState) => {
      if (state.useExternalServices) {
        tryStartRampsLifecycle();
      }
    },
  );
}

/**
 * Initialize the RampsController.
 *
 * Network hydration (`init`) is deferred until onboarding is complete and basic
 * functionality (`useExternalServices`) is enabled, matching Perps eligibility
 * and token-detection gating.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to hydrate from.
 * @param request.initMessenger - Messenger for onboarding and preferences state.
 * @returns The initialized controller and background API.
 */
export const RampsControllerInit: MessengerClientInitFunction<
  RampsController,
  RampsControllerMessenger,
  RampsControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const messengerClient = new RampsController({
    messenger: controllerMessenger,
    state: persistedState.RampsController ?? getDefaultRampsControllerState(),
  });

  const { startRampsLifecycle } = createRampsLifecycleManager(messengerClient);

  const tryStartRampsLifecycle = (): void => {
    if (shouldStartRampsLifecycle(initMessenger)) {
      startRampsLifecycle();
    }
  };

  tryStartRampsLifecycle();
  registerRampsLifecycleSubscriptions(initMessenger, tryStartRampsLifecycle);

  return {
    messengerClient,
    api: {
      ...getRampsControllerApi(messengerClient),
      startRampsLifecycle: tryStartRampsLifecycle,
    },
  };
};
