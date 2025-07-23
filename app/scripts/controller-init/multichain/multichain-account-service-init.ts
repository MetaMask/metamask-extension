import { MultichainAccountService } from '@metamask/multichain-account-service';
import { ControllerInitFunction } from '../types';
import { MultichainAccountServiceMessenger } from '../messengers/accounts';

/**
 * Initialize the multichain account controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const MultichainAccountServiceInit: ControllerInitFunction<
  MultichainAccountService,
  MultichainAccountServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
  });

  return { controller };
};
