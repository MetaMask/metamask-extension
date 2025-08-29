import { CaipChainId } from '@metamask/utils';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';

/**
 * Sanitizes an EIP-155 chain ID to the correct format.
 *
 * @param chainId - The chain ID to sanitize.
 * @returns The sanitized chain ID.
 */
export const getSanitizedChainId = (chainId: CaipChainId) => {
  if (chainId.startsWith('eip155')) {
    return 'eip155:0';
  }
  return chainId;
};

/**
 * Extracts the wallet ID from an account group ID.
 *
 * @param accountGroupId - The account group ID to extract the wallet ID from.
 * @returns The extracted wallet ID.
 */
export const extractWalletIdFromGroupId = (
  accountGroupId: AccountGroupId,
): AccountWalletId => {
  if (accountGroupId.startsWith('snap:')) {
    if (accountGroupId.includes('@') && accountGroupId.includes('/')) {
      const lastSlashIndex = accountGroupId.lastIndexOf('/');
      return accountGroupId.substring(0, lastSlashIndex) as AccountWalletId;
    }

    if (accountGroupId.includes('/')) {
      const parts = accountGroupId.split('/');
      return parts.slice(0, -1).join('/') as AccountWalletId;
    }

    return accountGroupId as AccountWalletId;
  }

  return accountGroupId.split('/')[0] as AccountWalletId;
};
