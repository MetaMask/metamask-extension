import { SnapKeyring } from '@metamask/eth-snap-keyring';
import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitFunction } from '../types';
import { KeyringType } from '../../../../shared/constants/keyring';

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
  const keyringController = getMessengerClient('KeyringController');
  const appStateController = getMessengerClient('AppStateController');

  const getSnapKeyring = async (): Promise<SnapKeyring> => {
    // Ensure the client is unlocked before attempting to access keyrings.
    await appStateController.getUnlockPromise(true);

    // TODO: Use `withKeyring` instead
    let [snapKeyring] = keyringController.getKeyringsByType(KeyringType.snap);

    if (!snapKeyring) {
      await keyringController.addNewKeyring(KeyringType.snap);
      // TODO: Use `withKeyring` instead
      [snapKeyring] = keyringController.getKeyringsByType(KeyringType.snap);
    }

    return snapKeyring as SnapKeyring;
  };

  // @TODO(snaps): This fixes an issue where `withKeyring` would lock the
  // `KeyringController` mutex. That meant that if a snap requested a keyring
  // operation (like requesting entropy) while the `KeyringController` was
  // locked, it would cause a deadlock. This is a temporary fix until we can
  // refactor how we handle requests to the Snaps Keyring.
  // @ts-expect-error: Types of `SnapKeyring` are incompatible.
  const withSnapKeyring: ConstructorParameters<
    typeof MultichainRoutingService
  >[0]['withSnapKeyring'] = async <
    Type extends (options: { keyring: SnapKeyring }) => unknown,
  >(
    operation: Type,
  ) => {
    const keyring = await getSnapKeyring();

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
