import type { InternalAccount } from '@metamask/keyring-internal-api';

/**
 * Sort accounts by type, prioritizing EIP155 accounts first
 *
 * @param accounts - Array of internal accounts to sort
 * @returns Sorted array of accounts with EIP155 accounts first
 */
export function sortAccounts(accounts: InternalAccount[]): InternalAccount[] {
  return [...accounts].sort((a, b) => {
    const aIsEvm = a.type.startsWith('eip155:');
    const bIsEvm = b.type.startsWith('eip155:');

    if (aIsEvm && !bIsEvm) {
      return -1;
    } // a comes first
    if (!aIsEvm && bIsEvm) {
      return 1;
    } // b comes first
    return 0; // maintain original order for same type
  });
}
