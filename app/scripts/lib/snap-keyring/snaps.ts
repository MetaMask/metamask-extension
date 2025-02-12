import { SnapId } from '@metamask/snaps-sdk';
import {
  getLocalizedSnapManifest,
  stripSnapPrefix,
} from '@metamask/snaps-utils';
import PREINSTALLED_SNAPS from '../../snaps/preinstalled-snaps';
import { SnapKeyringBuilderMessenger } from './types';

/**
 * Assert that a Snap ID is valid.
 *
 * @param snapId - Snap ID to assert.
 * @throws An error if the Snap ID is invalid.
 */
export function assertSnapIdIsValid(snapId: string): snapId is SnapId {
  if (!snapId) {
    throw new Error(`Invalid Snap ID: ${snapId}`);
  }
  return true;
}

/**
 * Check if a Snap is a preinstalled Snap.
 *
 * @param snapId - Snap ID to verify.
 * @returns True if Snap is a preinstalled Snap, false otherwise.
 */
export function isSnapPreinstalled(snapId: SnapId) {
  return PREINSTALLED_SNAPS.some((snap) => snap.snapId === snapId);
}

/**
 * Gets the localized Snap name or some falllback name otherwise.
 *
 * @param snapId - Snap ID.
 * @param messenger - Snap keyring messenger.
 * @returns The Snap name.
 */
export function getSnapName(
  snapId: SnapId,
  messenger: SnapKeyringBuilderMessenger,
) {
  const { currentLocale } = messenger.call('PreferencesController:getState');
  const snap = messenger.call('SnapController:get', snapId);

  if (!snap) {
    return stripSnapPrefix(snapId);
  }

  if (snap.localizationFiles) {
    const localizedManifest = getLocalizedSnapManifest(
      snap.manifest,
      currentLocale,
      snap.localizationFiles,
    );
    return localizedManifest.proposedName;
  }

  console.log(snap);
  return snap.manifest.proposedName;
}
