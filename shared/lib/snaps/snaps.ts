import { getLocalizedSnapManifest, stripSnapPrefix } from "@metamask/snaps-utils";

import { SnapKeyringBuilderMessenger } from "../../../app/scripts/lib/snap-keyring/types";

import { SnapId } from "@metamask/snaps-sdk";

export const PREINSTALLED_SNAPS = [
  'npm:@metamask/message-signing-snap',
  'npm:@metamask/ens-resolver-snap',
  'npm:@metamask/institutional-wallet-snap',
  'npm:@metamask/account-watcher',
  'npm:@metamask/preinstalled-example-snap',
  'npm:@metamask/bitcoin-wallet-snap',
  'npm:@metamask/solana-wallet-snap',
];

/**
 * Check if a Snap is a preinstalled Snap.
 *
 * @param snapId - Snap ID to verify.
 * @returns True if Snap is a preinstalled Snap, false otherwise.
 */
export function isSnapPreinstalled(snapId: SnapId) {
  return PREINSTALLED_SNAPS.some((snap) => snap === snapId);
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