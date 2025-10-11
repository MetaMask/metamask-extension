import DecryptMessageController from '../../controllers/decrypt-message';
import { ControllerInitFunction } from '../types';
import { DecryptMessageControllerMessenger } from '../messengers';
import { DecryptMessageControllerInitMessenger } from '../messengers/decrypt-message-controller-messenger';

/**
 * Initialize the decryptMessage controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.getController - Function to get other initialized controllers.
 * @param request.getUIState - Function to get the UI state.
 * @returns The initialized controller.
 */
export const DecryptMessageControllerInit: ControllerInitFunction<
  DecryptMessageController,
  DecryptMessageControllerMessenger,
  DecryptMessageControllerInitMessenger
> = ({ controllerMessenger, initMessenger, getController, getUIState }) => {
  const manager = getController('DecryptMessageManager');

  const controller = new DecryptMessageController({
    messenger: controllerMessenger,
    manager,
    getState: getUIState,
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
