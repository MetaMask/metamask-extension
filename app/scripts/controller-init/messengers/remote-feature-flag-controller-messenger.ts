import { Messenger } from '@metamask/messenger';
import { MetaMetricsControllerGetMetaMetricsIdAction } from '../../controllers/metametrics-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

export type RemoteFeatureFlagControllerMessenger = ReturnType<
  typeof getRemoteFeatureFlagControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * remote feature flag controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getRemoteFeatureFlagControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<
    'RemoteFeatureFlagController',
    never,
    never,
    typeof messenger
  >({
    namespace: 'RemoteFeatureFlagController',
    parent: messenger,
  });
}

type AllowedInitializationActions =
  | MetaMetricsControllerGetMetaMetricsIdAction
  | PreferencesControllerGetStateAction;

type AllowedInitializationEvents = PreferencesControllerStateChangeEvent;

export type RemoteFeatureFlagControllerInitMessenger = ReturnType<
  typeof getRemoteFeatureFlagControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the account tracker controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getRemoteFeatureFlagControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'RemoteFeatureFlagControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'RemoteFeatureFlagControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'MetaMetricsController:getMetaMetricsId',
      'PreferencesController:getState',
    ],
    events: ['PreferencesController:stateChange'],
  });
  return controllerInitMessenger;
}
