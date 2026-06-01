import { ClaimsControllerMessenger } from '@metamask/claims-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

export function getClaimsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ClaimsControllerMessenger>,
    MessengerEvents<ClaimsControllerMessenger>
  >,
) {
  const controllerMessenger: ClaimsControllerMessenger = new Messenger({
    namespace: 'ClaimsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ClaimsService:fetchClaimsConfigurations',
      'ClaimsService:getClaimsApiUrl',
      'ClaimsService:getRequestHeaders',
      'ClaimsService:generateMessageForClaimSignature',
      'ClaimsService:getClaims',
      'KeyringController:signPersonalMessage',
    ],
    events: [],
  });
  return controllerMessenger;
}

type InitActions = never;
type InitEvents = never;

export type ClaimsControllerInitMessenger = ReturnType<
  typeof getClaimsControllerInitMessenger
>;

export function getClaimsControllerInitMessenger(
  messenger: RootMessenger<InitActions, InitEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'ClaimsControllerInit',
    InitActions,
    InitEvents,
    typeof messenger
  >({
    namespace: 'ClaimsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    events: [],
    actions: [],
  });
  return controllerInitMessenger;
}
