import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';

import type { QrSyncDataServiceMessenger } from '../../controllers/qr-sync/types';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the QR
 * sync data service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The service messenger.
 */
export function getQrSyncDataServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<QrSyncDataServiceMessenger>,
    MessengerEvents<QrSyncDataServiceMessenger>
  >,
): QrSyncDataServiceMessenger {
  const qrSyncDataServiceMessenger: QrSyncDataServiceMessenger = new Messenger({
    namespace: 'QrSyncDataService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: qrSyncDataServiceMessenger,
    actions: [
      'KeyringController:withKeyringV2',
      'KeyringController:exportSeedPhrase',
      'KeyringController:exportAccount',
      'AccountTreeController:getAccountGroupObject',
      'AccountTreeController:getAccountWalletObject',
      'AccountsController:getAccount',
    ],
  });

  return qrSyncDataServiceMessenger;
}
