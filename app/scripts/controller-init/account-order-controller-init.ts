import { AccountOrderController } from '../controllers/account-order';
import { ControllerInitFunction } from './types';
import { AccountOrderControllerMessenger } from './messengers';

/**
 * Initialize the accountOrder controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AccountOrderControllerInit: ControllerInitFunction<
  AccountOrderController,
  AccountOrderControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new AccountOrderController({
    messenger: controllerMessenger,
    state: persistedState.AccountOrderController,
  });

  return {
    controller,
  };
};
