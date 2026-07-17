import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { isSnapKeyring } from '@metamask/eth-snap-keyring/v2';
import type { Json } from '@metamask/utils';
import { MultichainRoutingServiceInitMessenger } from '../messengers/snaps';
import { MessengerClientInitFunction } from '../types';

type WithSnapKeyringFn = ConstructorParameters<
  typeof MultichainRoutingService
>[0]['withSnapKeyring'];

type AppStateControllerWithUnlock = {
  getUnlockPromise: (waitForUnlock: boolean) => Promise<void>;
};

/**
 * Route a request through the Snap keyring that owns the requested account.
 *
 * @param initMessenger - The init messenger used to call KeyringController.
 * @param appStateController - Used to ensure the wallet is unlocked first.
 * @param operation - The operation to run once a keyring is resolved.
 * @returns The result of the operation.
 */
export async function withSnapKeyring(
  initMessenger: MultichainRoutingServiceInitMessenger,
  appStateController: AppStateControllerWithUnlock,
  operation: Parameters<WithSnapKeyringFn>[0],
): ReturnType<WithSnapKeyringFn> {
  // Ensure the client is unlocked before attempting to access keyrings.
  await appStateController.getUnlockPromise(true);

  return operation({
    keyring: {
      submitRequest: async (request): Promise<Json> =>
        initMessenger.call(
          'KeyringController:withKeyringV2',
          {
            filter: (keyring) =>
              isSnapKeyring(keyring) && keyring.hasAccount(request.account),
          },
          async ({ keyring }) => {
            if (!isSnapKeyring(keyring)) {
              throw new Error('Expected v2 Snap keyring');
            }
            return keyring.submitRequest({
              // NOTE: The `id` field is required but not used in this context. The Snap keyring will
              // generate its own unique ID for the request.
              id: '',
              origin: request.origin,
              scope: request.scope,
              account: request.account,
              request: {
                method: request.method,
                params: request.params,
              },
            });
          },
        ) as Promise<Json>,
    },
  });
}

/**
 * Initialize the multichain routing service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.initMessenger - The init messenger (with keyring controller
 * access) used to look up the per-snap Snap keyring that owns the request's
 * account.
 * @param request.getMessengerClient - Helper to access other messenger clients.
 * @returns The initialized service.
 */
export const MultichainRoutingServiceInit: MessengerClientInitFunction<
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
  MultichainRoutingServiceInitMessenger
> = ({ controllerMessenger, initMessenger, getMessengerClient }) => {
  const appStateController = getMessengerClient('AppStateController');

  const messengerClient = new MultichainRoutingService({
    messenger: controllerMessenger,
    withSnapKeyring: <Result>(...args: Parameters<WithSnapKeyringFn>) =>
      withSnapKeyring(
        initMessenger,
        appStateController,
        ...args,
      ) as Promise<Result>,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
