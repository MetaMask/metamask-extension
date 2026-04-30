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
 * Union of all AppMetadataController action types.
 */
export type AppMetadataControllerMethodActions =
  AppMetadataControllerMaybeRecordFirstTimeInfoAction;
