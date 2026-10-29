import { ProfileMetricsControllerMessenger } from '@metamask/profile-metrics-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * profile metrics controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProfileMetricsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ProfileMetricsControllerMessenger>,
    MessengerEvents<ProfileMetricsControllerMessenger>
  >,
) {
  const controllerMessenger: ProfileMetricsControllerMessenger = new Messenger({
    namespace: 'ProfileMetricsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getState',
      'ProfileMetricsService:submitMetrics',
      'ProfileMetricsService:fetchNonces',
      'ProofOfOwnershipService:sign',
    ],
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'KeyringController:lock',
      'KeyringController:unlock',
      'TransactionController:transactionSubmitted',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type ProfileMetricsControllerInitMessenger = ReturnType<
  typeof getProfileMetricsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions needed to initialize
 * the profile metrics controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProfileMetricsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'ProfileMetricsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'ProfileMetricsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });
  return controllerInitMessenger;
}
