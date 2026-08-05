import { QrSyncDataService } from '../../controllers/qr-sync/qr-sync-data-service';
import type { QrSyncDataServiceMessenger } from '../../controllers/qr-sync/types';
import type { MessengerClientInitFunction } from '../types';

/**
 * Initialize the QR sync data service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const QrSyncDataServiceInit: MessengerClientInitFunction<
  QrSyncDataService,
  QrSyncDataServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new QrSyncDataService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
