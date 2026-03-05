import {
  ConfigRegistryApiService,
  type ConfigRegistryApiServiceMessenger,
} from '@metamask/config-registry-controller';
import { Messenger } from '@metamask/messenger';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import { SDK } from '@metamask/profile-sync-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = RemoteFeatureFlagControllerGetStateAction;

export type ConfigRegistryControllerMessenger = ReturnType<
  typeof getConfigRegistryControllerMessenger
>;

/**
 * Creates the API service messenger and registers ConfigRegistryApiService on it.
 * The service registers its own fetchConfig handler. Returns the messenger for
 * the controller chain; the service instance is retained to avoid GC.
 *
 * @param parent - The root controller messenger to delegate from.
 * @returns The API service messenger with fetchConfig registered.
 */
function createConfigRegistryApiServiceMessenger(
  parent: RootMessenger<AllowedActions, never>,
) {
  const apiServiceMessenger = new Messenger<
    'ConfigRegistryApiService',
    AllowedActions,
    never,
    typeof parent
  >({
    namespace: 'ConfigRegistryApiService',
    parent,
  });

  parent.delegate({
    messenger: apiServiceMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });

  const apiService = new ConfigRegistryApiService({
    messenger:
      apiServiceMessenger as unknown as ConfigRegistryApiServiceMessenger,
    env: SDK.Env.UAT,
    fetch: globalThis.fetch.bind(globalThis),
  });

  return { apiServiceMessenger, apiService };
}

/**
 * Get a restricted messenger for the Config Registry controller. This is scoped to the
 * actions and events that the Config Registry controller is allowed to handle.
 * ConfigRegistryApiService registers its own fetchConfig handler on the API service
 * messenger; the controller messenger receives actions and events for polling and
 * feature-flag handling.
 *
 * @param messenger - The root controller messenger.
 * @returns The restricted controller messenger.
 */
export function getConfigRegistryControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const { apiServiceMessenger } =
    createConfigRegistryApiServiceMessenger(messenger);

  const controllerMessenger = new Messenger<
    'ConfigRegistryController',
    AllowedActions,
    never,
    typeof apiServiceMessenger
  >({
    namespace: 'ConfigRegistryController',
    parent: apiServiceMessenger,
  });

  // Messenger type does not expose delegate; cast required to wire controller messenger.
  (
    apiServiceMessenger as unknown as {
      delegate: (params: {
        messenger: unknown;
        actions: string[];
        events?: string[];
      }) => void;
    }
  ).delegate({
    messenger: controllerMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'ConfigRegistryApiService:fetchConfig',
    ],
    events: [
      'RemoteFeatureFlagController:stateChange',
      'KeyringController:unlock',
      'KeyringController:lock',
    ],
  });

  // Forward ConfigRegistryController:stateChange to root so the store (subscribed on root)
  // receives it and persistence runs—same pattern as controllers with parent: root.
  (
    apiServiceMessenger as unknown as {
      delegate: (params: { messenger: unknown; events: string[] }) => void;
    }
  ).delegate({
    messenger,
    events: ['ConfigRegistryController:stateChange'],
  });

  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

type AllowedInitializationEvents = RemoteFeatureFlagControllerStateChangeEvent;

export type ConfigRegistryControllerInitMessenger = ReturnType<
  typeof getConfigRegistryControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the Config Registry controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getConfigRegistryControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'ConfigRegistryControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'ConfigRegistryControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
    events: ['RemoteFeatureFlagController:stateChange'],
  });
  return controllerInitMessenger;
}
