import { Messenger, MessengerActions } from '@metamask/messenger';
import { ClaimsServiceMessenger } from '@metamask/claims-controller';
import { RootMessenger } from '../../../lib/messenger';

export function getClaimsServiceMessenger(
  messenger: RootMessenger<MessengerActions<ClaimsServiceMessenger>, never>,
) {
  const serviceMessenger: ClaimsServiceMessenger = new Messenger({
    namespace: 'ClaimsService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
    events: [],
  });
  return serviceMessenger;
}

type InitActions = never;
type InitEvents = never;

export type ClaimsServiceInitMessenger = ReturnType<
  typeof getClaimsServiceInitMessenger
>;

export function getClaimsServiceInitMessenger(
  messenger: RootMessenger<InitActions, InitEvents>,
) {
  return new Messenger<
    'ClaimsServiceInit',
    InitActions,
    InitEvents,
    typeof messenger
  >({
    namespace: 'ClaimsServiceInit',
    parent: messenger,
  });
}
