import { DecryptMessageManager } from '@metamask/message-manager';
import { ControllerInitFunction } from '../types';
import { DecryptMessageManagerMessenger } from '../messengers';

/**
 * Initialize the decrypt message manager.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const DecryptMessageManagerInit: ControllerInitFunction<
  DecryptMessageManager,
  DecryptMessageManagerMessenger
> = ({ controllerMessenger }) => {
  const controller = new DecryptMessageManager({
    additionalFinishStatuses: ['decrypted'],
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
