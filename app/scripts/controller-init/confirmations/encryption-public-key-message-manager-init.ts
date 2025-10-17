import { EncryptionPublicKeyManager } from '@metamask/message-manager';
import { ControllerInitFunction } from '../types';
import { EncryptionPublicKeyManagerMessenger } from '../messengers';

/**
 * Initialize the encryption public key message manager.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const EncryptionPublicKeyManagerInit: ControllerInitFunction<
  EncryptionPublicKeyManager,
  EncryptionPublicKeyManagerMessenger
> = ({ controllerMessenger }) => {
  const controller = new EncryptionPublicKeyManager({
    additionalFinishStatuses: ['received'],
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
