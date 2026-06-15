import { Hex } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';

/**
 * Builds a CAIP-19 asset ID for an ERC-20 token.
 *
 * The address is normalized to lowercase so that lookups are consistent
 * regardless of whether the caller passes an EIP-55 checksummed address.
 *
 * @param address - The ERC-20 contract address (hex string).
 * @param chainId - The EVM chain ID in hex format (e.g. "0x1" for Mainnet).
 * @returns A CAIP-19 asset ID string, e.g. "eip155:1/erc20:0xabc…".
 */
export function buildEvmCaip19AssetId(address: string, chainId: Hex): string {
  return `${toEvmCaipChainId(chainId)}/erc20:${address.toLowerCase()}`;
}
