import type { AssetsControllerMessenger } from '@metamask/assets-controller';
import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import {
  assetsController,
  type DefaultActions,
  type DefaultEvents,
  type RootMessenger as WalletRootMessenger,
} from '@metamask/wallet';
import {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../../controllers/onboarding';
import type { PreferencesControllerGetStateAction } from '../../../controllers/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

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
 * Get a messenger for the AssetsController.
 *
 * Delegations are owned by `@metamask/wallet`'s `assetsController.getMessenger`.
 * The extension root messenger is wider than the wallet's default root, so it
 * is cast to the type that configuration expects.
 *
 * @param messenger - The root controller messenger.
 * @returns The controller messenger.
 */
export function getAssetsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AssetsControllerMessenger>,
    MessengerEvents<AssetsControllerMessenger>
  >,
): AssetsControllerMessenger {
  return assetsController.getMessenger(
    messenger as unknown as WalletRootMessenger<DefaultActions, DefaultEvents>,
  );
}

/**
 * Actions needed during AssetsController initialization.
 */
type AllowedInitializationActions =
  | AuthenticationControllerGetBearerTokenAction
  | SnapControllerHandleRequestAction
  | PreferencesControllerGetStateAction
  | OnboardingControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

/**
 * Events needed during AssetsController initialization.
 */
type AllowedInitializationEvents = OnboardingControllerStateChangeEvent;

/**
 * Get a restricted messenger for AssetsController initialization.
 * This is scoped to actions and events needed during initialization.
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
    events: ['OnboardingController:stateChange'],
  });

  return initMessenger;
}
