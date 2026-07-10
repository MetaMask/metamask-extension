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
import { applyRampsNetworkGate } from './ramps-network-gate';

function isRampsNetworkAllowed(
  initMessenger: RampsControllerInitMessenger,
): boolean {
  const { completedOnboarding } = initMessenger.call(
    'OnboardingController:getState',
  );
  const { useExternalServices } = initMessenger.call(
    'PreferencesController:getState',
  );

  return completedOnboarding && Boolean(useExternalServices);
}

function createRampsLifecycleManager(
  messengerClient: RampsController,
  isPollingAllowed: () => boolean,
) {
  let lifecycleStarted = false;
  let lifecycleRunId = 0;

  const startRampsLifecycle = (): void => {
    if (lifecycleStarted) {
      return;
    }
    lifecycleStarted = true;
    const runId = lifecycleRunId;

    messengerClient
      .init()
      .then(() => {
        if (runId !== lifecycleRunId || !isPollingAllowed()) {
          return;
        }
        messengerClient.startOrderPolling();
      })
      .catch((error) => {
        if (runId !== lifecycleRunId) {
          return;
        }
        lifecycleStarted = false;
        console.error('RampsController failed to initialize', error);
      });
  };

  const stopRampsLifecycle = (): void => {
    lifecycleRunId += 1;
    messengerClient.stopOrderPolling();
    lifecycleStarted = false;
  };

  return { startRampsLifecycle, stopRampsLifecycle };
}

function registerRampsLifecycleSubscriptions(
  initMessenger: RampsControllerInitMessenger,
  tryStartRampsLifecycle: () => void,
  tryStopRampsLifecycle: () => void,
): void {
  initMessenger.subscribe(
    'OnboardingController:stateChange',
    (state: OnboardingControllerState) => {
      if (state.completedOnboarding) {
        tryStartRampsLifecycle();
      } else {
        tryStopRampsLifecycle();
      }
    },
  );

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    (state: PreferencesControllerState) => {
      if (state.useExternalServices) {
        tryStartRampsLifecycle();
      } else {
        tryStopRampsLifecycle();
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

  const isNetworkAllowed = () => isRampsNetworkAllowed(initMessenger);
  applyRampsNetworkGate(messengerClient, isNetworkAllowed);

  const { startRampsLifecycle, stopRampsLifecycle } =
    createRampsLifecycleManager(messengerClient, isNetworkAllowed);

  const tryStartRampsLifecycle = (): void => {
    if (isNetworkAllowed()) {
      startRampsLifecycle();
    }
  };

  const tryStopRampsLifecycle = (): void => {
    if (!isNetworkAllowed()) {
      stopRampsLifecycle();
    }
  };

  tryStartRampsLifecycle();
  registerRampsLifecycleSubscriptions(
    initMessenger,
    tryStartRampsLifecycle,
    tryStopRampsLifecycle,
  );

  return {
    messengerClient,
    api: {
      ...getRampsControllerApi(messengerClient),
      startRampsLifecycle: tryStartRampsLifecycle,
      stopRampsLifecycle,
    },
  };
};
