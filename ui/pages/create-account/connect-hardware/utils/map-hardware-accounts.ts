import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
import type { HardwareWalletAccount } from '../../../../components/multichain-accounts/hardware-account-card';
import type { RawHardwareAccount } from '../types';

/**
 * Maps raw hardware wallet accounts into wallet account cards.
 *
 * @param accounts - Accounts returned from connectHardware.
 * @param connectedAccounts - Lowercase addresses already imported in MetaMask.
 * @param networkName - Localized Ethereum network name for each address row.
 */
export function mapHardwareAccountsToWalletAccounts(
  accounts: RawHardwareAccount[],
  connectedAccounts: string[],
  networkName: string,
): HardwareWalletAccount[] {
  return accounts.map((account) => {
    const normalizedAddress = account.address.toLowerCase();
    const isAlreadyConnected = connectedAccounts.includes(normalizedAddress);

    return {
      id: `account-${account.index}`,
      name: `Account ${account.index + 1}`,
      addresses: [
        {
          id: `eth-${account.index}`,
          networkName,
          address: account.address,
          iconUrl: ETH_TOKEN_IMAGE_URL,
        },
      ],
      isAlreadyConnected,
    };
  });
}

/**
 * Converts account card ids to hardware account indices.
 *
 * @param accountIds - Selected account card ids from the account selector.
 */
export function mapAccountIdsToIndices(accountIds: string[]): number[] {
  return accountIds.flatMap((accountId) => {
    const index = Number.parseInt(accountId.replace('account-', ''), 10);

    return Number.isNaN(index) ? [] : [index];
  });
}

/**
 * Converts hardware account indices to account card ids.
 *
 * @param indices - Selected hardware account indices.
 */
export function mapIndicesToAccountIds(indices: number[]): string[] {
  return indices.map((index) => `account-${index}`);
}
