import {
  HttpSecretEscrowClient,
  MockSecretEscrowClient,
} from '@metamask/secret-escrow-client';
import {
  SecretEscrowController,
  SecretEscrowControllerMessenger,
} from '@metamask/secret-escrow-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the secret escrow controller.
 *
 * When `SECRET_ESCROW_URL` is set (e.g. `http://127.0.0.1:8787`), uses the
 * file-backed HTTP mock so enrollment survives wallet wipe. Otherwise uses the
 * in-memory {@link MockSecretEscrowClient}.
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
  const escrowUrl = process.env.SECRET_ESCROW_URL;
  const client =
    typeof escrowUrl === 'string' && escrowUrl.length > 0
      ? new HttpSecretEscrowClient({ baseUrl: escrowUrl })
      : new MockSecretEscrowClient();

  const messengerClient = new SecretEscrowController({
    state: persistedState.SecretEscrowController,
    messenger: controllerMessenger,
    client,
  });

  return {
    messengerClient,
  };
};
