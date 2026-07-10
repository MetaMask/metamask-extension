import type { QrSyncSimulatorAction } from '../../../../app/scripts/controllers/qr-sync/e2e/types';

/** Ordered simulator actions for the single-wallet happy path. */
export const QR_SYNC_HAPPY_PATH_ACTIONS: QrSyncSimulatorAction[] = [
  'mobileScanned',
  'deliverSyncOffer',
  'deliverSyncCompleted',
];
