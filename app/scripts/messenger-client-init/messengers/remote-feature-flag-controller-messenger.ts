import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerMessenger } from '@metamask/remote-feature-flag-controller';
import { MetaMetricsControllerGetMetaMetricsIdAction } from '../../controllers/metametrics-controller-method-action-types';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * remote feature flag controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getRemoteFeatureFlagControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<RemoteFeatureFlagControllerMessenger>,
    MessengerEvents<RemoteFeatureFlagControllerMessenger>
  >,
): RemoteFeatureFlagControllerMessenger {
  const controllerMessenger: RemoteFeatureFlagControllerMessenger =
    new Messenger({
      namespace: 'RemoteFeatureFlagController',
      parent: messenger,
    });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | MetaMetricsControllerGetMetaMetricsIdAction
  | PreferencesControllerGetStateAction
  | OnboardingControllerGetStateAction;

type AllowedInitializationEvents =
  | PreferencesControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent;

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
      'OnboardingController:getState',
    ],
    events: [
      'PreferencesController:stateChange',
      'OnboardingController:stateChange',
    ],
  });
  return controllerInitMessenger;
}
