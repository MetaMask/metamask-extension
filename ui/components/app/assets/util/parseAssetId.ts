export type ParsedAssetId = {
  namespace: string; // Namespace (e.g., eip155, solana, bip122)
  chainId: string; // Full chain ID (namespace + blockchain ID)
  assetNamespace: string; // Asset namespace (e.g., slip44, erc20, token, ordinal)
  assetReference: string; // Asset reference (on-chain address, token identifier, etc.)
};

export const parseAssetId = (assetId: string): ParsedAssetId => {
  // Ensure input is valid
  if (!assetId.includes('/') || !assetId.includes(':')) {
    throw new Error(
      'Invalid assetId format. Must be in "namespace:blockchainId/assetNamespace:assetReference" format.',
    );
  }

  // Extract chainId and asset details
  const [chainId, assetDetails] = assetId.split('/');

  // Validate and extract namespace + blockchainId
  const chainParts = chainId.split(':');
  if (chainParts.length !== 2) {
    throw new Error(
      'Invalid chainId format. Expected "namespace:blockchainId".',
    );
  }
  const [namespace, blockchainId] = chainParts;

  if (!namespace || !blockchainId) {
    throw new Error(
      'Invalid chainId format. Both namespace and blockchainId must be non-empty.',
    );
  }

  // Validate and extract assetNamespace and assetReference
  const separatorIndex = assetDetails.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(
      'Invalid asset details format. Expected "assetNamespace:assetReference".',
    );
  }

  const assetNamespace = assetDetails.substring(0, separatorIndex);
  const assetReference = assetDetails.substring(separatorIndex + 1);

  // Ensure assetNamespace is valid
  const assetNamespaceRegex = /^[-a-z0-9]{3,8}$/u;
  if (!assetNamespaceRegex.test(assetNamespace)) {
    throw new Error(`Invalid assetNamespace format: "${assetNamespace}".`);
  }

  // Ensure assetReference is valid
  const assetReferenceRegex = /^[-.%a-zA-Z0-9]{1,128}$/u;
  if (!assetReferenceRegex.test(assetReference)) {
    throw new Error(`Invalid assetReference format: "${assetReference}".`);
  }

  return {
    namespace,
    chainId: `${namespace}:${blockchainId}`, // Keep it consistent
    assetNamespace,
    assetReference,
  };
};
