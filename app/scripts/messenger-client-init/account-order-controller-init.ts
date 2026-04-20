import {
  AccountOrderController,
  AccountOrderControllerMessenger,
} from '../controllers/account-order';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the accountOrder controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AccountOrderControllerInit: MessengerClientInitFunction<
  AccountOrderController,
  AccountOrderControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new AccountOrderController({
    messenger: controllerMessenger,
    state: persistedState.AccountOrderController,
  });

  return {
    messengerClient,
  };
};
