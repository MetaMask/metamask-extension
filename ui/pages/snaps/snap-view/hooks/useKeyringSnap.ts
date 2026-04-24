import type { SnapId } from '@metamask/snaps-sdk';
import { useMessenger } from '../../../../hooks/useMessenger';
import type { RouteMessengerInstance } from '../messenger';
import { KeyringType } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';
import { getInternalAccounts } from '../../../../selectors';
import { useEffect, useState } from 'react';
import type { InternalAccount } from '@metamask/keyring-internal-api';

/**
 * Hook to get the accounts associated with a keyring Snap.
 *
 * @param snapId - The ID of the Snap to get accounts for.
 * @param isKeyringSnap - Whether the Snap is a keyring Snap. Used to
 * conditionally fetch accounts only for keyring Snaps, while still allowing the
 * hook to be used in components that render both keyring and non-keyring Snaps.
 * @returns The accounts associated with the keyring Snap.
 */
export function useKeyringSnap(snapId: SnapId, isKeyringSnap: boolean) {
  const messenger = useMessenger<RouteMessengerInstance>();
  const internalAccounts = useSelector(getInternalAccounts);

  const [keyringAccounts, setKeyringAccounts] = useState<InternalAccount[]>([]);

  useEffect(() => {
    async function getAccounts() {
      const [snapKeyring] = await messenger.call(
        'KeyringController:getKeyringsByType',
        KeyringType.Snap,
      );

      if (snapKeyring) {
        const addresses = await snapKeyring.getAccountsBySnapId(snapId);
        const snapIdentities = internalAccounts.filter((internalAccount) =>
          addresses.includes(internalAccount.address.toLowerCase()),
        );

        setKeyringAccounts(snapIdentities);
      }
    }

    if (isKeyringSnap) {
      getAccounts().catch((error) => {
        console.error('Failed to get accounts for keyring Snap:', error);
      });
    }
  }, [messenger, snapId, isKeyringSnap, internalAccounts]);

  return keyringAccounts;
}
