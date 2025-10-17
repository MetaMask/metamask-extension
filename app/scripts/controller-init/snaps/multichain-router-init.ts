import {
  MultichainRouter,
  MultichainRouterArgs,
} from '@metamask/snaps-controllers';
import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { ControllerInitFunction } from '../types';
import { MultichainRouterMessenger } from '../messengers/snaps';
import { KeyringType } from '../../../../shared/constants/keyring';

/**
 * Initialize the multichain router.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.getController
 * @returns The initialized service.
 */
export const MultichainRouterInit: ControllerInitFunction<
  MultichainRouter,
  MultichainRouterMessenger
> = ({ controllerMessenger, getController }) => {
  const keyringController = getController('KeyringController');

  const getSnapKeyring = async (): Promise<SnapKeyring> => {
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
  const withSnapKeyring: MultichainRouterArgs['withSnapKeyring'] = async <
    Type extends (options: { keyring: SnapKeyring }) => unknown,
  >(
    operation: Type,
  ) => {
    const keyring = await getSnapKeyring();

    return operation({ keyring });
  };

  const controller = new MultichainRouter({
    messenger: controllerMessenger,
    withSnapKeyring,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
