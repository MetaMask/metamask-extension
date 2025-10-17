import { Messenger } from '@metamask/base-controller';
import type { AccountsControllerGetStateAction } from '@metamask/accounts-controller';
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { AddLog } from '@metamask/logging-controller';
import type { GatorPermissionsControllerDecodePermissionFromPermissionContextForOriginAction } from '@metamask/gator-permissions-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import type {
  KeyringControllerSignMessageAction,
  KeyringControllerSignPersonalMessageAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

type AllowedActions =
  | AccountsControllerGetStateAction
  | AddApprovalRequest
  | AddLog
  | GatorPermissionsControllerDecodePermissionFromPermissionContextForOriginAction
  | NetworkControllerGetNetworkClientByIdAction
  | KeyringControllerSignMessageAction
  | KeyringControllerSignPersonalMessageAction
  | KeyringControllerSignTypedMessageAction;

export type SignatureControllerMessenger = ReturnType<
  typeof getSignatureControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * signature controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSignatureControllerMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'SignatureController',
    allowedActions: [
      'AccountsController:getState',
      'ApprovalController:addRequest',
      'KeyringController:signMessage',
      'KeyringController:signPersonalMessage',
      'KeyringController:signTypedMessage',
      'LoggingController:add',
      'NetworkController:getNetworkClientById',
      'GatorPermissionsController:decodePermissionFromPermissionContextForOrigin',
    ],
    allowedEvents: [],
  });
}

type AllowedInitializationActions =
  | MetaMetricsControllerTrackEventAction
  | PreferencesControllerGetStateAction;

export type SignatureControllerInitMessenger = ReturnType<
  typeof getSignatureControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the signature controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSignatureControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'SignatureControllerInit',
    allowedActions: [
      'MetaMetricsController:trackEvent',
      'PreferencesController:getState',
    ],
    allowedEvents: [],
  });
}
