/**
 * BNS integration surface for the MetaMask fork (additive, upstream-safe).
 */

export {
  isBnsRegistryConfigured,
  requireBareGatewayHost,
  requireNonZeroAddress,
  resolveBnsRuntimeConfig,
} from './config';
export type { BnsConfigSources, BnsRuntimeConfig } from './config';
export {
  BNS_CHAIN_ID_DECIMAL,
  BNS_CHAIN_ID_HEX,
  BNS_DEFAULT_IPFS_GATEWAY_HOST,
  BNS_DEFAULT_RPC_TIMEOUT_MS,
  BNS_FALLBACK_IPFS_GATEWAY_HOST,
  BNS_READ_RPC_URLS,
  BNS_RPC_QUORUM,
  BNS_SEED_REGISTRY_ADDRESS,
} from './constants';
export { decodeIpfsContenthash } from './contenthash';
export { toBnsResolveDisplay, toBnsResolveError } from './display';
export type {
  BnsResolveDisplay,
  BnsResolveDisplayErr,
  BnsResolveDisplayOk,
} from './display';
export {
  decideBnsTabRedirect,
  extractBnesHostFromNavigationUrl,
  extractPathFromNavigationUrl,
} from './redirect-policy';
export type { BnsRedirectDecision } from './redirect-policy';
export {
  assertBnsReadRpcUrls,
  ethCallWithQuorum,
} from './quorum';
export type {
  EthCallQuorumOptions,
  JsonRpcEthCallRequest,
  QuorumFetch,
} from './quorum';
export { getBrnkcUsdPrice, clearBrnkcPriceCache } from './price';
export type { BrnkcPriceResult } from './price';
export { resolveBnesContent } from './resolve';
export type {
  BnsEthCall,
  ResolveBnesContentOptions,
  ResolveBnesContentResult,
} from './resolve';
export {
  buildTrustedIpfsGatewayUrl,
  hasOnlyValidDnsLabels,
  isAllowedBnesHost,
  isAllowedGatewayUrl,
  isValidCid,
  normalizeBnesName,
} from './security';
