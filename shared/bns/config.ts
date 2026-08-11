/**
 * Fail-closed runtime configuration for MetaMask BNS resolution (H1.3).
 *
 * Empty registry, zero address, or non-canonical gateway/RPC settings must
 * throw before any eth_call is issued.
 */

import {
  BNS_DEFAULT_IPFS_GATEWAY_HOST,
  BNS_DEFAULT_RPC_TIMEOUT_MS,
  BNS_READ_RPC_URLS,
  BNS_SEED_REGISTRY_ADDRESS,
  BNS_SEED_ORACLE_ADDRESS,
  BRNKC_NATIVE_ADDRESS,
  BRNKC_USD_VIRTUAL_ADDRESS,
  BNS_ORACLE_PRICE_CACHE_TTL_MS,
} from './constants';
import { assertBnsReadRpcUrls } from './quorum';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type BnsRuntimeConfig = {
  registryAddress: string;
  gatewayHost: string;
  rpcUrls: readonly string[];
  timeoutMs: number;
  oracleAddress?: string;
};

export type BnsConfigSources = {
  registryAddress?: string | null;
  gatewayHost?: string | null;
  rpcUrls?: readonly string[] | null;
  timeoutMs?: number | null;
  oracleAddress?: string | null;
};

/**
 * Normalize a non-zero EVM address or reject.
 *
 * @param value - Candidate address.
 * @param label - Field name for error messages.
 * @returns Lower-case 0x-prefixed address.
 */
export function requireNonZeroAddress(
  value: string | null | undefined,
  label: string,
): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new Error(
      `${label} is not configured (fail closed until a non-zero address is set)`,
    );
  }
  const address = String(value).trim();
  if (!/^0x[0-9a-fA-F]{40}$/u.test(address)) {
    throw new Error(`${label} must be a 20-byte hex address`);
  }
  if (address.toLowerCase() === ZERO_ADDRESS) {
    throw new Error(`${label} must not be the zero address`);
  }
  return address.toLowerCase();
}

/**
 * Normalize a bare gateway hostname (no scheme, path, credentials, or port).
 *
 * @param value - Candidate host.
 * @returns Lower-case hostname.
 */
export function requireBareGatewayHost(
  value: string | null | undefined,
): string {
  const host = (value ?? BNS_DEFAULT_IPFS_GATEWAY_HOST).trim().toLowerCase();
  if (!host) {
    throw new Error('BNS gateway host must be a non-empty bare hostname');
  }
  if (
    host.includes('://') ||
    host.includes('/') ||
    host.includes('@') ||
    host.includes(':') ||
    host.includes('?') ||
    host.includes('#')
  ) {
    throw new Error(
      `BNS gateway host must be a bare hostname without scheme or path: ${host}`,
    );
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/u.test(host)) {
    throw new Error('BNS gateway host must not be an IP literal');
  }
  return host;
}

/**
 * Resolve and validate BNS runtime config. Throws on any unsafe or empty field.
 *
 * @param sources - Optional overrides; defaults come from constants / env seed.
 * @returns Validated runtime config.
 */
export function resolveBnsRuntimeConfig(
  sources: BnsConfigSources = {},
): BnsRuntimeConfig {
  const registryAddress = requireNonZeroAddress(
    sources.registryAddress ?? BNS_SEED_REGISTRY_ADDRESS,
    'BNS registry address',
  );
  const gatewayHost = requireBareGatewayHost(sources.gatewayHost);
  const rpcUrls = assertBnsReadRpcUrls(
    sources.rpcUrls ?? BNS_READ_RPC_URLS,
  );
  const timeoutMs =
    sources.timeoutMs === null || sources.timeoutMs === undefined
      ? BNS_DEFAULT_RPC_TIMEOUT_MS
      : sources.timeoutMs;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('BNS RPC timeout must be a positive integer');
  }

  const oracleAddress = sources.oracleAddress ?? BNS_SEED_ORACLE_ADDRESS;

  return {
    registryAddress,
    gatewayHost,
    rpcUrls,
    timeoutMs,
    oracleAddress: oracleAddress || undefined,
  };
}

/**
 * Whether a registry seed is present without throwing (for UI readiness checks).
 *
 * @param registryAddress - Candidate registry.
 * @returns True only if a non-zero address is available.
 */
export function isBnsRegistryConfigured(
  registryAddress?: string | null,
): boolean {
  try {
    requireNonZeroAddress(
      registryAddress ?? BNS_SEED_REGISTRY_ADDRESS,
      'BNS registry address',
    );
    return true;
  } catch {
    return false;
  }
}
