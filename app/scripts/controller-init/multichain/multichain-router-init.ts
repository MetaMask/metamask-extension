import { MultichainRouter, MultichainRouterArgs } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { MultichainRouterMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainRouterInit: ControllerInitFunction<
  MultichainRouter,
  MultichainRouterMessenger
> = ({ controllerMessenger}) => {
  const controller = new MultichainRouter({
    messenger: controllerMessenger,
    // Binding the call to provide the selector only giving the controller the option to pass the operation
    withSnapKeyring: (...args: Parameters<MultichainRouterArgs['withSnapKeyring']>) =>
      controllerMessenger.call(
        'KeyringController:withKeyring',
        {
          type: 'Snap Keyring',
        },
        ...args
      ) as unknown as ReturnType<MultichainRouterArgs['withSnapKeyring']>
  });

  return {
    controller,
  };
};
