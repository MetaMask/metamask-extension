import { SnapKeyring } from '@metamask/eth-snap-keyring';
import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the multichain routing service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.getMessengerClient
 * @returns The initialized service.
 */
export const MultichainRoutingServiceInit: MessengerClientInitFunction<
  MultichainRoutingService,
  MultichainRoutingServiceMessenger
> = ({ controllerMessenger, getMessengerClient }) => {
  const snapAccountService = getMessengerClient('SnapAccountService');
  const appStateController = getMessengerClient('AppStateController');

  // @ts-expect-error: Types of `SnapKeyring` are incompatible.
  const withSnapKeyring: ConstructorParameters<
    typeof MultichainRoutingService
  >[0]['withSnapKeyring'] = async <
    Type extends (options: { keyring: SnapKeyring }) => unknown,
  >(
    operation: Type,
  ) => {
    // Ensure the client is unlocked before attempting to access keyrings.
    await appStateController.getUnlockPromise(true);

    const keyring = await snapAccountService.getLegacySnapKeyring();

    return operation({ keyring });
  };

  const messengerClient = new MultichainRoutingService({
    messenger: controllerMessenger,
    withSnapKeyring,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
