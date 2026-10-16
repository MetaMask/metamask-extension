import { normalizeNetworkPolicy } from './network-policy';

/** The only runtime connection accepted by the RPC validation broker. */
export const RPC_VALIDATION_PORT = 'rpc-endpoint-validation';

/** Packaged page containing only the fixed RPC validation request. */
export const RPC_VALIDATION_PAGE = 'rpc-endpoint-validation.html';

/** The broker never accepts a caller-provided JSON-RPC method or payload. */
export const RPC_VALIDATION_REQUEST_ID = 'metamask-rpc-validation';

export type RpcValidationResponse =
  | { chainId: string }
  | { error: { code?: number; httpStatus?: number } };

/**
 * Parse a user-selected RPC URL without granting access to it.
 *
 * @param value - The URL entered by the user.
 * @returns The canonical HTTP URL, without its fragment or BasicAuth fields.
 */
export function getRpcValidationFetchUrl(value: string): string {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new Error('Invalid RPC endpoint URL.');
  }
  try {
    // Reuse the authority's early-captured URL intrinsics. A dependency may
    // acquire mutable browser URL prototypes from another realm.
    return normalizeNetworkPolicy({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: [value],
    }).allowedRpcUrls[0];
  } catch {
    throw new Error('RPC endpoint validation requires HTTP or HTTPS.');
  }
}
