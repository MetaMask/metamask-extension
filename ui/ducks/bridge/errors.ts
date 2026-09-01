export class BridgeMissingNetworkConfigError extends Error {
  readonly caipChainId: string;

  constructor(caipChainId: string, hexChainId: string) {
    super(
      `Bridge deeplink referenced a supported chain (${caipChainId} / hex: ${hexChainId}) that is missing from both the user's network configurations and FEATURED_RPCS. This is a configuration bug; the chain must be added to FEATURED_RPCS or the network config must be populated before it can be used as a bridge source.`,
    );
    this.name = 'BridgeMissingNetworkConfigError';
    this.caipChainId = caipChainId;
  }
}
