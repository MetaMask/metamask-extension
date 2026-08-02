import { MockSecretEscrowClient } from '@metamask/secret-escrow-client';
import {
  SecretEscrowController,
  SecretEscrowControllerMessenger,
} from '@metamask/secret-escrow-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the secret escrow controller with an in-memory mock backend.
 *
 * Replace {@link MockSecretEscrowClient} with a real HTTP/CubeSigner client
 * when the escrow service is available.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SecretEscrowControllerInit: MessengerClientInitFunction<
  SecretEscrowController,
  SecretEscrowControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new SecretEscrowController({
    state: persistedState.SecretEscrowController,
    messenger: controllerMessenger,
    client: new MockSecretEscrowClient(),
  });

  return {
    messengerClient,
  };
};
