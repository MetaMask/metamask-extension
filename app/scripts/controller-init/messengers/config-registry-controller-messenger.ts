import { ConfigRegistryApiService } from '@metamask/config-registry-controller';
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
 * Get a restricted messenger for the Config Registry controller. This is scoped to the
 * actions and events that the Config Registry controller is allowed to handle.
 * Registers ConfigRegistryApiService:fetchConfig on an intermediate messenger so the
 * controller can call it.
 *
 * @param messenger - The root controller messenger.
 * @returns The restricted controller messenger.
 */
export function getConfigRegistryControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const apiService = new ConfigRegistryApiService({
    env: SDK.Env.UAT,
    fetch: globalThis.fetch.bind(globalThis),
  });

  const apiServiceMessenger = new Messenger<
    'ConfigRegistryApiService',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'ConfigRegistryApiService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: apiServiceMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });

  (
    apiServiceMessenger as unknown as {
      registerActionHandler: (
        type: string,
        handler: (options?: { etag?: string }) => Promise<unknown>,
      ) => void;
    }
  ).registerActionHandler('ConfigRegistryApiService:fetchConfig', (options) =>
    apiService.fetchConfig(options),
  );

  const controllerMessenger = new Messenger<
    'ConfigRegistryController',
    AllowedActions,
    never,
    typeof apiServiceMessenger
  >({
    namespace: 'ConfigRegistryController',
    parent: apiServiceMessenger,
  });

  (
    apiServiceMessenger as unknown as {
      delegate: (params: { messenger: unknown; actions: string[] }) => void;
    }
  ).delegate({
    messenger: controllerMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'ConfigRegistryApiService:fetchConfig',
    ],
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
