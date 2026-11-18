import { getImageForChainId } from '../selectors/multichain';
import { useConfigRegistryNetworks } from './useConfigRegistryNetworks';

/**
 * Resolves the network or native asset image URL for a chain ID (hex or
 * CAIP-2), preferring the config registry image URLs over the static maps.
 *
 * @param chainId - The chain ID to resolve an image for.
 * @returns The image URL, or undefined when the chain ID is unknown.
 */
export function useImageForChainId(
  chainId: string | undefined,
): string | undefined {
  const { networkImageUrls } = useConfigRegistryNetworks();
  return chainId ? getImageForChainId(chainId, networkImageUrls) : undefined;
}
