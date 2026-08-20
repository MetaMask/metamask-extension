import type { KeyringControllerWithKeyringV2Action } from '@metamask/keyring-controller';
import { isSnapKeyring } from '@metamask/eth-snap-keyring/v2';
import { SnapId } from '@metamask/snaps-sdk';
import { RootMessenger } from '../messenger';

/**
 * Get the addresses of the accounts managed by a given Snap.
 *
 * Looks up the per-snap v2 Snap keyring and returns the addresses of the
 * accounts it manages. If no keyring exists for the given Snap, returns an
 * empty array.
 *
 * @param messenger - The messenger used to call the keyring controller.
 * @param snapId - Snap ID to get accounts for.
 * @returns The addresses of the accounts.
 */
export const getAccountsBySnapId = async (
  messenger: RootMessenger<KeyringControllerWithKeyringV2Action, never>,
  snapId: SnapId,
): Promise<string[]> => {
  try {
    return (await messenger.call(
      'KeyringController:withKeyringV2',
      {
        filter: (keyring) =>
          isSnapKeyring(keyring) && keyring.snapId === snapId,
      },
      async ({ keyring }) => {
        if (!isSnapKeyring(keyring)) {
          return [];
        }
        const accounts = await keyring.getAccounts();
        return accounts.map((account) => account.address);
      },
    )) as string[];
  } catch {
    // No keyring for this Snap.
    return [];
  }
};
