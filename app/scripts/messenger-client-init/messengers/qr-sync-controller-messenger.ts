import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';

import type { QrSyncControllerMessenger } from '../../controllers/qr-sync/types';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the QR
 * sync controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The controller messenger.
 */
export function getQrSyncControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<QrSyncControllerMessenger>,
    MessengerEvents<QrSyncControllerMessenger>
  >,
): QrSyncControllerMessenger {
  const qrSyncControllerMessenger: QrSyncControllerMessenger = new Messenger({
    namespace: 'QrSyncController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: qrSyncControllerMessenger,
    actions: [
      'KeyringController:getState',
      'KeyringController:withKeyringV2',
      'KeyringController:exportSeedPhrase',
      'KeyringController:exportAccount',
    ],
  });

  return qrSyncControllerMessenger;
}
