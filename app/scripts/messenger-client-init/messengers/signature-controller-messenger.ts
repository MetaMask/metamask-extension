import {
  Messenger,
  MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { SignatureControllerMessenger } from '@metamask/signature-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * signature controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSignatureControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SignatureControllerMessenger>,
    MessengerEvents<SignatureControllerMessenger>
  >,
) {
  const controllerMessenger: SignatureControllerMessenger = new Messenger({
    namespace: 'SignatureController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getState',
      'ApprovalController:addRequest',
      'KeyringController:signMessage',
      'KeyringController:signPersonalMessage',
      'KeyringController:signTypedMessage',
      'LoggingController:add',
      'NetworkController:getNetworkClientById',
      'GatorPermissionsController:decodePermissionFromPermissionContextForOrigin',
    ],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'SignatureControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'SignatureControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'MetaMetricsController:trackEvent',
      'PreferencesController:getState',
    ],
  });
  return controllerInitMessenger;
}
