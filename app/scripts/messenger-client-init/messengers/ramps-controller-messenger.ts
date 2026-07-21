import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import {
  type OnboardingControllerGetStateAction,
  type OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import {
  type PreferencesControllerGetStateAction,
  type PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the RampsController. Delegates the RampsService and
 * TransakService actions required by the controller.
 *
 * @param messenger - The root messenger.
 * @returns The RampsControllerMessenger.
 */
export function getRampsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<RampsControllerMessenger>,
    MessengerEvents<RampsControllerMessenger>
  >,
): RampsControllerMessenger {
  const controllerMessenger: RampsControllerMessenger = new Messenger({
    namespace: 'RampsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      ...RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
      // The controller reads the `moneyHeadlessAllProviders` feature flag
      // itself for quote widening.
      'RemoteFeatureFlagController:getState',
      'UserStorageController:getState',
      'UserStorageController:performGetStorage',
      'UserStorageController:performGetStorageAllFeatureEntries',
      'UserStorageController:performSetStorage',
      'UserStorageController:performBatchSetStorage',
      'UserStorageController:listEntropySources',
      'AuthenticationController:isSignedIn',
    ],
    events: [],
  });

  return controllerMessenger;
}

type AllowedInitializationActions =
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedInitializationEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

export type RampsControllerInitMessenger = ReturnType<
  typeof getRampsControllerInitMessenger
>;

/**
 * Get the init messenger for the RampsController. Scoped to onboarding and
 * preferences state needed to defer network hydration until onboarding is
 * complete and basic functionality is enabled.
 *
 * @param messenger - The root messenger.
 * @returns The RampsControllerInitMessenger.
 */
export function getRampsControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'RampsControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'RampsControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'OnboardingController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });

  return controllerInitMessenger;
}
