import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  ClaimsControllerMessenger,
  ClaimsServiceFetchClaimsConfigurationsAction,
  ClaimsServiceGenerateMessageForClaimSignatureAction,
  ClaimsServiceGetClaimsAction,
  ClaimsServiceGetClaimsApiUrlAction,
  ClaimsServiceGetRequestHeadersAction,
} from '@metamask/claims-controller';
import { KeyringControllerSignPersonalMessageAction } from '@metamask/keyring-controller';
import { RootMessenger } from '../../../lib/messenger';

type AllowedActions =
  | MessengerActions<ClaimsControllerMessenger>
  | ClaimsServiceFetchClaimsConfigurationsAction
  | ClaimsServiceGetRequestHeadersAction
  | ClaimsServiceGetClaimsApiUrlAction
  | ClaimsServiceGenerateMessageForClaimSignatureAction
  | ClaimsServiceGetClaimsAction
  | KeyringControllerSignPersonalMessageAction;
type AllowedEvents = MessengerEvents<ClaimsControllerMessenger>;

export type ClaimsControllerMessengerType = ReturnType<
  typeof getClaimsControllerMessenger
>;

export function getClaimsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): ClaimsControllerMessenger {
  const controllerMessenger = new Messenger<
    'ClaimsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
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
