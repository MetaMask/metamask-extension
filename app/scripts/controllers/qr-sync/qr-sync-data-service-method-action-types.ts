/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { QrSyncDataService } from './qr-sync-data-service';

/**
 * Builds sync-ready wallet export entries from the user's account group selection.
 *
 * @param password - The wallet password used to export secrets.
 * @param selectedAccountGroupIds - The account groups selected for sync.
 * @returns Wallet export entries for the sync-ready payload.
 */
export type QrSyncDataServiceBuildWalletExportEntriesAction = {
  type: `QrSyncDataService:buildWalletExportEntries`;
  handler: QrSyncDataService['buildWalletExportEntries'];
};

/**
 * Union of all QrSyncDataService action types.
 */
export type QrSyncDataServiceMethodActions =
  QrSyncDataServiceBuildWalletExportEntriesAction;
