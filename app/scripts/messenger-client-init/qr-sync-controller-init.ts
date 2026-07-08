import { RELAY_URL } from '../controllers/qr-sync/constants';
import { KeyManager } from '../controllers/qr-sync/key-manager';
import { QrSyncController } from '../controllers/qr-sync/qr-sync-controller';
import type { QrSyncControllerMessenger } from '../controllers/qr-sync/types';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the QR sync controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the
 * controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const QrSyncControllerInit: MessengerClientInitFunction<
  QrSyncController,
  QrSyncControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new QrSyncController({
    messenger: controllerMessenger,
    keyManager: new KeyManager(),
    relayUrl: RELAY_URL,
    state: persistedState.QrSyncController,
  });

  return {
    messengerClient,
  };
};
