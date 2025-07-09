import { MultichainAccountController } from '@metamask/multichain-account-controller';
import { ControllerInitFunction } from '../types';
import { MultichainAccountControllerMessenger } from '../messengers/accounts';

/**
 * Initialize the multichain account controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const MultichainAccountControllerInit: ControllerInitFunction<
  MultichainAccountController,
  MultichainAccountControllerMessenger
> = ({ controllerMessenger }) => {
  const controller = new MultichainAccountController({
    messenger: controllerMessenger,
  });

  return { controller };
};
