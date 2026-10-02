import { MpcSigningMfaController } from '../controllers/mpc-signing-mfa/mpc-signing-mfa-controller';
import type { MpcSigningMfaControllerMessenger } from '../controllers/mpc-signing-mfa/mpc-signing-mfa-controller';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the controller that prompts before an MPC signing 2FA token.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const MpcSigningMfaControllerInit: MessengerClientInitFunction<
  MpcSigningMfaController,
  MpcSigningMfaControllerMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MpcSigningMfaController({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
  };
};
