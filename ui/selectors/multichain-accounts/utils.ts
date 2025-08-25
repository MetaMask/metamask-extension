import { CaipChainId } from '@metamask/utils';

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
