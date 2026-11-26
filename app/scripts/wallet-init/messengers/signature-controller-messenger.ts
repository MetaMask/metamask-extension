import { Messenger } from '@metamask/messenger';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

export type SignatureControllerInitMessengerActions =
  PreferencesControllerGetStateAction;

export type SignatureControllerInitMessenger = ReturnType<
  typeof getSignatureControllerInitMessenger
>;

/**
 * Create a messenger restricted to the actions needed by the extension-side
 * signature controller instance options.
 *
 * @param messenger - The root messenger used to create the restricted
 * messenger.
 * @returns The restricted signature controller init messenger.
 */
export function getSignatureControllerInitMessenger(
  messenger: RootMessenger<SignatureControllerInitMessengerActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'SignatureControllerInit',
    SignatureControllerInitMessengerActions,
    never,
    typeof messenger
  >({
    namespace: 'SignatureControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['PreferencesController:getState'],
  });
  return controllerInitMessenger;
}
