import { SnapId } from '@metamask/snaps-sdk';
import { isFlask } from '../build-types';

/**
 * Whether to force local Snaps to be treated as preinstalled Snaps.
 *
 * This is used in development environments to allow Snaps to use features that
 * are normally reserved for preinstalled Snaps.
 */
const FORCE_PREINSTALLED_SNAPS =
  isFlask() && process.env.FORCE_PREINSTALLED_SNAPS === 'true';

export const PREINSTALLED_SNAPS = [
  'npm:@metamask/message-signing-snap',
  'npm:@metamask/ens-resolver-snap',
  'npm:@metamask/institutional-wallet-snap',
  'npm:@metamask/account-watcher',
  'npm:@metamask/preinstalled-example-snap',
  'npm:@metamask/bitcoin-wallet-snap',
  'npm:@metamask/solana-wallet-snap',
  'npm:@metamask/tron-wallet-snap',
  'npm:@metamask/permissions-kernel-snap',
  'npm:@metamask/gator-permissions-snap',
];

/**
 * Check if a Snap is a preinstalled Snap.
 *
 * @param snapId - Snap ID to verify.
 * @returns True if Snap is a preinstalled Snap, false otherwise.
 */
export function isSnapPreinstalled(snapId: SnapId) {
  // For development purposes, allow local Snaps to be treated as preinstalled
  // Snaps if the `FORCE_PREINSTALLED_SNAPS` environment variable is enabled
  // and this is a Flask build.
  if (FORCE_PREINSTALLED_SNAPS && snapId.startsWith('local:')) {
    return true;
  }

  return PREINSTALLED_SNAPS.some((snap) => snap === snapId);
}
