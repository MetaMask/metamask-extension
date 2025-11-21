import { Messenger, MessengerActions } from '@metamask/messenger';
import { ClaimsServiceMessenger } from '@metamask/claims-controller';
import { AuthenticationControllerGetBearerToken } from '@metamask/profile-sync-controller/auth';
import { RootMessenger } from '../../../lib/messenger';

type AllowedActions =
  | MessengerActions<ClaimsServiceMessenger>
  | AuthenticationControllerGetBearerToken;

export type ClaimsServiceMessengerType = ReturnType<
  typeof getClaimsServiceMessenger
>;

export function getClaimsServiceMessenger(
  messenger: RootMessenger<AllowedActions>,
) {
  const serviceMessenger = new Messenger<
    'ClaimsService',
    AllowedActions,
    never,
    typeof messenger
  >({
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
