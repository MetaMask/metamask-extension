import { Messenger } from '@metamask/messenger';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Messenger type for AssetsController initialization.
 */
export type AssetsControllerInitMessenger = ReturnType<
  typeof getAssetsControllerInitMessenger
>;

/**
 * Actions delegated to the AssetsController initialization messenger.
 */
export const ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS = [
  'AuthenticationController:getBearerToken',
  'SnapController:handleRequest',
  'PreferencesController:getState',
  'OnboardingController:getState',
  'RemoteFeatureFlagController:getState',
] as const;

/**
 * Events delegated to the AssetsController initialization messenger.
 */
export const ASSETS_CONTROLLER_INIT_DELEGATED_EVENTS = [
  'OnboardingController:stateChange',
  'PreferencesController:stateChange',
] as const;

/**
 * Actions needed while building AssetsController options.
 */
type AllowedInitializationActions =
  | AuthenticationControllerGetBearerTokenAction
  | SnapControllerHandleRequestAction
  | PreferencesControllerGetStateAction
  | OnboardingControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

/**
 * Events needed while building AssetsController options.
 *
 * Preference changes are subscribed here, not on the controller messenger.
 * Options are built inside `new Wallet()`, before PreferencesController exists,
 * and the wallet owns the AssetsController messenger.
 */
type AllowedInitializationEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

/**
 * Get a restricted messenger for AssetsController initialization.
 * This is scoped to actions and events needed while building instance options.
 *
 * @param messenger - The root controller messenger.
 * @returns The restricted initialization messenger.
 */
export function getAssetsControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const initMessenger = new Messenger<
    'AssetsControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'AssetsControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: initMessenger,
    actions: [...ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS],
    events: [...ASSETS_CONTROLLER_INIT_DELEGATED_EVENTS],
  });

  return initMessenger;
}
