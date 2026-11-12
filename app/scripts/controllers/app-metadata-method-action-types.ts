/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { AppMetadataController } from './app-metadata';

/**
 * Records the first time info if it hasn't been set yet.
 * This captures the version and date when MetaMask was first installed.
 * Once set, this value never changes.
 *
 * @param version - The current MetaMask version
 */
export type AppMetadataControllerMaybeRecordFirstTimeInfoAction = {
  type: `AppMetadataController:maybeRecordFirstTimeInfo`;
  handler: AppMetadataController['maybeRecordFirstTimeInfo'];
};

/**
 * Records Google Analytics identifiers captured at install time.
 * Write-once: no-op if install attribution is already set, or if `cookieId` is empty.
 *
 * @param attribution - Install-time GA cookie values.
 * @param attribution.cookieId - Raw `_ga` cookie value.
 * @param attribution.gaClientId - Parsed Google Analytics client identifier.
 */
export type AppMetadataControllerSetInstallAttributionAction = {
  type: `AppMetadataController:setInstallAttribution`;
  handler: AppMetadataController['setInstallAttribution'];
};

/**
 * Union of all AppMetadataController action types.
 */
export type AppMetadataControllerMethodActions =
  | AppMetadataControllerMaybeRecordFirstTimeInfoAction
  | AppMetadataControllerSetInstallAttributionAction;
