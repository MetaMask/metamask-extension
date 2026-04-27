import { EncryptionPublicKeyManager } from '@metamask/message-manager';
import { MessengerClientInitFunction } from '../types';
import { EncryptionPublicKeyManagerMessenger } from '../messengers';

/**
 * Initialize the encryption public key message manager.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const EncryptionPublicKeyManagerInit: MessengerClientInitFunction<
  EncryptionPublicKeyManager,
  EncryptionPublicKeyManagerMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new EncryptionPublicKeyManager({
    additionalFinishStatuses: ['received'],
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient,
  };
};
