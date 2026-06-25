import { BackendWebSocketServiceMessenger as BackendPlatformWebSocketServiceMessenger } from '@metamask/core-backend';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import { RootMessenger } from '../../../lib/messenger';

export type BackendWebSocketServiceMessenger =
  BackendPlatformWebSocketServiceMessenger;

/**
 * Get a restricted messenger for the Backend Platform WebSocket service.
 * This is scoped to backend platform operations and services.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getBackendWebSocketServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<BackendWebSocketServiceMessenger>,
    MessengerEvents<BackendWebSocketServiceMessenger>
  >,
): BackendPlatformWebSocketServiceMessenger {
  const serviceMessenger: BackendWebSocketServiceMessenger = new Messenger({
    namespace: 'BackendWebSocketService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'AuthenticationController:getBearerToken', // Get auth token (includes wallet unlock check)
    ],
    events: [
      'AuthenticationController:stateChange', // Listen for authentication state (sign in/out)
      'KeyringController:lock', // Listen for wallet lock
      'KeyringController:unlock', // Listen for wallet unlock
    ],
  });
  return serviceMessenger;
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | AuthenticationControllerGetBearerTokenAction;

export type BackendWebSocketServiceInitMessenger = ReturnType<
  typeof getBackendWebSocketServiceInitMessenger
>;

export function getBackendWebSocketServiceInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'BackendWebSocketServiceInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'BackendWebSocketServiceInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'AuthenticationController:getBearerToken',
    ],
  });
  return controllerInitMessenger;
}
