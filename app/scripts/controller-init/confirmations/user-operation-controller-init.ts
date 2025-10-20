import { UserOperationController } from '@metamask/user-operation-controller';
import { ControllerInitFunction } from '../types';
import { UserOperationControllerMessenger } from '../messengers';

/**
 * Initialize the user operation controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state.
 * @param request.getController - Function to get other controllers.
 * @returns The initialized controller.
 */
export const UserOperationControllerInit: ControllerInitFunction<
  UserOperationController,
  UserOperationControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const gasFeeController = getController('GasFeeController');

  const controller = new UserOperationController({
    messenger: controllerMessenger,
    state: persistedState.UserOperationController,
    // @ts-expect-error: `UserOperationController` does not accept `undefined`.
    entrypoint: process.env.EIP_4337_ENTRYPOINT,
    getGasFeeEstimates: (...args) =>
      gasFeeController.fetchGasFeeEstimates(...args),
  });

  return {
    controller,
  };
};
