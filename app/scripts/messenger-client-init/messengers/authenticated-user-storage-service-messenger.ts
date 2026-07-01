import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { AuthenticatedUserStorageMessenger } from '@metamask/authenticated-user-storage';
import { RootMessenger } from '../../lib/messenger';

export function getAuthenticatedUserStorageServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<AuthenticatedUserStorageMessenger>,
    MessengerEvents<AuthenticatedUserStorageMessenger>
  >,
): AuthenticatedUserStorageMessenger {
  const serviceMessenger: AuthenticatedUserStorageMessenger = new Messenger({
    namespace: 'AuthenticatedUserStorageService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
    events: [],
  });

  return serviceMessenger;
}
