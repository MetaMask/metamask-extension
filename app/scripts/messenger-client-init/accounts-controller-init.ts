import { AccountsController } from '@metamask/accounts-controller';
import { MessengerClientInitFunction } from './types';
import { AccountsControllerMessenger } from './messengers';

/**
 * Initialize the accounts controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AccountsControllerInit: MessengerClientInitFunction<
  AccountsController,
  AccountsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new AccountsController({
    messenger: controllerMessenger,
    // @ts-expect-error: Accounts controller does not accept partial state.
    state: persistedState.AccountsController,
  });

  return {
    messengerClient,
  };
};
