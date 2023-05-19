import { convertHexToDecimal } from '@metamask/controller-utils';

/**
 * Format token list assets to use image proxy from Codefi.
 *
 * @param params - Object that contains chainID and tokenAddress.
 * @param params.chainId - ChainID of network in decimal or hexadecimal format.
 * @param params.tokenAddress - Address of token in mixed or lowercase.
 * @returns Formatted image url
 */
export const formatIconUrlWithProxy = ({
  chainId,
  tokenAddress,
}: {
  chainId: string;
  tokenAddress: string;
}) => {
  const chainIdDecimal = convertHexToDecimal(chainId).toString();
  return `https://static.metafi.codefi.network/api/v1/tokenIcons/${chainIdDecimal}/${tokenAddress.toLowerCase()}.png`;
};
