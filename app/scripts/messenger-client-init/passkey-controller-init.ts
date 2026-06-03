import {
  PasskeyController,
  PasskeyControllerMessenger,
} from '@metamask/passkey-controller';
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
    rpId: undefined,
    rpName: PASSKEY_RP_NAME,
    expectedRPID: extensionOrigin,
    expectedOrigin: extensionOrigin,
    userName: PASSKEY_USER_NAME,
    userDisplayName: PASSKEY_USER_DISPLAY_NAME,
  });

  return {
    messengerClient,
  };
};
