import {
  AssetsController,
  type AssetsControllerMessenger,
} from '@metamask/assets-controller';
import { MessengerClientInitFunction } from '../types';

/**
 * Run `AssetsController.init()` again after SnapController and
 * AccountTreeController exist.
 *
 * `wallet.init()` runs this once while the wallet is constructed, before those
 * controllers are registered. Snap discovery then finds no keyring snaps.
 * Calling `init()` again is safe: it refreshes enabled chains and data sources
 * without registering another messenger.
 *
 * The wallet instance is returned with null state keys so the extension store
 * does not persist it a second time. `metamask-controller` reads it via
 * `wallet.getInstance`.
 *
 * @param request - The messenger-client init request.
 * @param request.getMessengerClient - Resolves the wallet-owned controller.
 * @returns The wallet instance, excluded from both extension state maps.
 */
export const AssetsControllerInit: MessengerClientInitFunction<
  AssetsController,
  AssetsControllerMessenger
> = ({ getMessengerClient }) => {
  const messengerClient = getMessengerClient('AssetsController');

  messengerClient.init().catch((error: unknown) => {
    console.error(error);
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
