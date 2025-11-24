import { UserProfileControllerMessenger } from '@metamask/user-profile-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = MessengerActions<UserProfileControllerMessenger>;

type AllowedEvents = MessengerEvents<UserProfileControllerMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * accounts controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getUserProfileControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const userProfileControllerMessenger = new Messenger<
    'UserProfileController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'UserProfileController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: userProfileControllerMessenger,
    actions: [
      'AccountsController:listAccounts',
      'UserProfileService:updateProfile',
    ],
    events: [
      'AccountsController:accountAdded',
      'KeyringController:lock',
      'KeyringController:unlock',
    ],
  });
  return userProfileControllerMessenger;
}
