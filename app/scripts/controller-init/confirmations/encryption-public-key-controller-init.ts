import EncryptionPublicKeyController from '../../controllers/encryption-public-key';
import { ControllerInitFunction } from '../types';
import {
  EncryptionPublicKeyControllerMessenger,
  EncryptionPublicKeyControllerInitMessenger,
} from '../messengers';

/**
 * Initialize the encryption public key controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.getController - Function to get other initialized controllers.
 * @param request.getUIState - Function to get the UI state.
 * @returns The initialized controller.
 */
export const EncryptionPublicKeyControllerInit: ControllerInitFunction<
  EncryptionPublicKeyController,
  EncryptionPublicKeyControllerMessenger,
  EncryptionPublicKeyControllerInitMessenger
> = ({ controllerMessenger, initMessenger, getController, getUIState }) => {
  const manager = getController('EncryptionPublicKeyManager');
  const keyringController = getController('KeyringController');

  const controller = new EncryptionPublicKeyController({
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
    controller,
  };
};
