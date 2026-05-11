import { PasskeyController } from '@metamask/passkey-controller';
import type { PasskeyControllerMessenger } from './messengers';
import { MessengerClientInitFunction } from './types';

const PASSKEY_RP_NAME = 'MetaMask';
const PASSKEY_USER_NAME = 'MetaMask Wallet';
const PASSKEY_USER_DISPLAY_NAME = 'MetaMask Wallet';

/**
 * Initialize the passkey controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.extension - The browser extension API object.
 * @returns The initialized controller.
 */
export const PasskeyControllerInit: MessengerClientInitFunction<
  PasskeyController,
  PasskeyControllerMessenger
> = ({ controllerMessenger, persistedState, extension }) => {
  const extensionUrl = extension.runtime?.getURL?.('');
  const extensionOrigin = extensionUrl ? extensionUrl.replace(/\/$/u, '') : '';

  const messengerClient = new PasskeyController({
    state: persistedState.PasskeyController,
    messenger: controllerMessenger,
    rpID: extensionOrigin, // used to match the RP ID in the passkey ceremony
    rpName: PASSKEY_RP_NAME,
    expectedOrigin: extensionOrigin,
    userName: PASSKEY_USER_NAME,
    userDisplayName: PASSKEY_USER_DISPLAY_NAME,
  });

  return {
    messengerClient,
  };
};
