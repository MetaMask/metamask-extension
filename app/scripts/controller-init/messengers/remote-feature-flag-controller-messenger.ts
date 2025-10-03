import { Messenger } from '@metamask/base-controller';
import { MetaMetricsControllerGetMetaMetricsIdAction } from '../../controllers/metametrics-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';

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
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'RemoteFeatureFlagController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
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
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'RemoteFeatureFlagControllerInit',
    allowedActions: [
      'MetaMetricsController:getMetaMetricsId',
      'PreferencesController:getState',
    ],
    allowedEvents: ['PreferencesController:stateChange'],
  });
}
