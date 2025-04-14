import { MultichainRouter } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { MultichainRouterMessenger } from '../messengers/multichain';
import { MultichainRouterInitMessenger } from '../messengers/multichain/multichain-router-messenger';

/**
 * Initialize the Multichain Network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The init messenger. This has access to
 * different functions than the controller messenger, and should be used for
 * initialization purposes only.
 * @returns The initialized controller.
 */
export const MultichainRouterInit: ControllerInitFunction<
  MultichainRouter,
  MultichainRouterMessenger,
  MultichainRouterInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new MultichainRouter({
    messenger: controllerMessenger,
    // Binding the call to provide the selector only giving the controller the option to pass the operation
    withSnapKeyring: (...args) =>
      // @ts-expect-error mistmatch with the withSnapKeyring signature and withKeyring.
      initMessenger.call(
        'KeyringController:withKeyring',
        {
          type: 'Snap Keyring',
        },
        // @ts-expect-error mistmatch with the withSnapKeyring signature and withKeyring.
        ...args,
      ),
  });

  return {
    controller,
  };
};
