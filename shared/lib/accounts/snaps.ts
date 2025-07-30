import { SnapId } from '@metamask/snaps-sdk';
import {
  getLocalizedSnapManifest,
  stripSnapPrefix,
} from '@metamask/snaps-utils';
// eslint-disable-next-line import/no-restricted-paths
import { SnapKeyringBuilderMessenger } from '../../../app/scripts/lib/snap-keyring/types';
import { BITCOIN_WALLET_SNAP_ID } from './bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from './solana-wallet-snap';
import { TRON_WALLET_SNAP_ID } from './tron-wallet-snap';

/**
 * A constant array that contains the IDs of whitelisted multichain
 * wallet Snaps. These Snaps can be used by the extension to implement
 * core features (e.g. Send flow).
 *
 * @constant
 * @type {SnapId[]}
 */
const WHITELISTED_SNAPS = [
  BITCOIN_WALLET_SNAP_ID,
  SOLANA_WALLET_SNAP_ID,
  TRON_WALLET_SNAP_ID,
];

/**
 * Checks if the given Snap ID corresponds to a multichain wallet Snap.
 *
 * @param id - The ID of the Snap to check.
 * @returns True if the Snap ID is in the whitelist, false otherwise.
 */
export function isMultichainWalletSnap(id: SnapId): boolean {
  return WHITELISTED_SNAPS.includes(id);
}

/**
 * Get the localized Snap name or some fallback name otherwise.
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

  return snap.manifest.proposedName;
}
