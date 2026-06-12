import {
  EncryptionPublicKeyController,
  EncryptionPublicKeyControllerMessenger,
} from '../../controllers/encryption-public-key';
import { MessengerClientInitFunction } from '../types';
import { EncryptionPublicKeyControllerInitMessenger } from '../messengers';

/**
 * Initialize the encryption public key controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.getMessengerClient - Function to get other initialized controllers.
 * @param request.getUIState - Function to get the UI state.
 * @returns The initialized controller.
 */
export const EncryptionPublicKeyControllerInit: MessengerClientInitFunction<
  EncryptionPublicKeyController,
  EncryptionPublicKeyControllerMessenger,
  EncryptionPublicKeyControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  getMessengerClient,
  getUIState,
}) => {
  const manager = getMessengerClient('EncryptionPublicKeyManager');
  const keyringController = getMessengerClient('KeyringController');

  const messengerClient = new EncryptionPublicKeyController({
    messenger: controllerMessenger,
    manager,
    getState: getUIState,
    getAccountKeyringType: (account) => {
      return keyringController.getAccountKeyringType(account);
    },
    getEncryptionPublicKey: (address) => {
      return initMessenger.call(
        'KeyringController:getEncryptionPublicKey',
        address,
      );
    },
    metricsEvent: initMessenger.call.bind(
      initMessenger,
      'MetaMetricsController:trackEvent',
    ),
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient,
  };
};
