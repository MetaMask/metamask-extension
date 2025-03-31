import { SnapId } from '@metamask/snaps-sdk';
import { GetSnapKeyring } from './types';

/**
 * Get the addresses of the accounts managed by a given Snap.
 *
 * @param getSnapKeyring
 * @param snapId - Snap ID to get accounts for.
 * @returns The addresses of the accounts.
 */
export const getAccountsBySnapId = async (
  getSnapKeyring: GetSnapKeyring,
  snapId: SnapId,
) => {
  const snapKeyring = await getSnapKeyring();
  return await snapKeyring.getAccountsBySnapId(snapId);
};
