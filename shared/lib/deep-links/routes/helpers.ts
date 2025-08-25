type Caip2ChainId = {
  /**
   * CAIP-2 chain ID in the format "namespace:blockchainId"
   */
  id: string;
  /**
   * The namespace of the CAIP-2 chain ID, like "eip155" for Ethereum-like chains.
   */
  namespace: string;
  /**
   * The blockchain ID of the CAIP-2 chain ID, like "1" for Ethereum mainnet.
   */
  blockchainId: string;
};

type ParsedCaip19 = {
  /**
   * The CAIP-2 chain ID object parsed from the asset ID.
   */
  chainId: Caip2ChainId;
  /**
   * The asset namespace, which is a short identifier for the type of asset.
   * For example, "erc20" for ERC-20 tokens.
   */
  assetNamespace: string;
  /**
   * The asset reference, which is a unique identifier for the asset within its namespace.
   * For example, the contract address for an ERC-20 token.
   */
  assetReference: string;
  /**
   * The full asset type string in CAIP-19 format, which combines the chain ID and asset definition.
   * For example, "eip155:1/erc20:0x1234567890abcdef1234567890abcdef12345678".
   */
  assetType: string;
  /**
   * The token ID, if present, which is an additional identifier for the asset.
   * This is optional and may not be present for all asset types.
   * For example, a specific token ID for an NFT.
   */
  tokenId?: string;
  /**
   * The full CAIP-19 asset ID string, which includes the chain ID, asset definition,
   * and optionally the token ID.
   * For example, "eip155:1/erc20:0x1234567890abcdef1234567890abcdef12345678/1".
   * This is optional and may not be present if the token ID is not applicable.
   */
  assetId?: string;
};

/**
 * Parses a CAIP-19 asset ID string into its components.
 *
 * @see https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md
 * @param str - The CAIP-19 asset ID string to parse
 * @returns null if any part of the string is invalid, otherwise returns an object
 * containing the parsed components.
 */
export function parseAssetID(str: string): ParsedCaip19 | null {
  const parts = str.split('/');
  if (parts.length < 2 || parts.length > 3) {
    // Invalid format: must have chain_id/asset_def and optionally /token_id
    return null;
  }

  const rawChainId = parts[0];
  const assetDef = parts[1];
  const tokenId = parts.length === 3 ? parts[2] : undefined;

  const chainIdParts = rawChainId.split(':');
  if (chainIdParts.length !== 2) {
    // Invalid CAIP-2 chain_id format (namespace:reference)
    return null;
  }
  const chainId: Caip2ChainId = {
    id: rawChainId,
    namespace: chainIdParts[0],
    blockchainId: chainIdParts[1],
  };

  // Validate chain_id.namespace ([-a-z0-9]{3,8} as per CAIP-2)
  if (!/^[-a-z0-9]{3,8}$/u.test(chainId.namespace)) {
    return null;
  }
  // Validate chain_id.blockchainId ([-a-zA-Z0-9]{1,32} as per CAIP-2)
  if (!/^[-a-zA-Z0-9]{1,32}$/u.test(chainId.blockchainId)) {
    return null;
  }

  const assetNamespaceRefParts = assetDef.split(':');
  if (assetNamespaceRefParts.length !== 2) {
    // Invalid asset_namespace:asset_reference format
    return null;
  }
  const assetNamespace = assetNamespaceRefParts[0];
  const assetReference = assetNamespaceRefParts[1];

  // Validate asset_namespace ([-a-z0-9]{3,8} as per CAIP-19)
  if (!/^[-a-z0-9]{3,8}$/u.test(assetNamespace)) {
    return null;
  }

  // Validate asset_reference ([-.%a-zA-Z0-9]{1,128} as per CAIP-19)
  if (!/^[-.%a-zA-Z0-9]{1,128}$/u.test(assetReference)) {
    return null;
  }

  const assetType = `${rawChainId}/${assetNamespace}:${assetReference}`;
  let assetId: string | undefined;
  if (tokenId !== undefined) {
    // Validate token_id ([-.%a-zA-Z0-9]{1,78} as per CAIP-19)
    // Empty string should be invalid
    if (tokenId === '' || !/^[-.%a-zA-Z0-9]{1,78}$/u.test(tokenId)) {
      return null;
    }
    assetId = `${assetType}/${tokenId}`;
  }

  return {
    chainId,
    assetNamespace,
    assetReference,
    assetType,
    tokenId,
    assetId,
  };
}
