/**
 * Phase 3 BNS resolve entry for MetaMask.
 *
 * Pipeline (fail-closed at every step):
 *   1. normalize / validate `.bnes` host
 *   2. namehash
 *   3. registry.resolver(node) via injected eth_call (or quorum helper)
 *   4. resolver.contenthash(node)
 *   5. decode IPFS contenthash + structural CID check
 *   6. build trusted path-gateway URL
 *
 * webRequest tab redirect lives in app/scripts/lib/bns/web-request.ts (H1.5)
 * and only navigates to a trusted gateway URL — never extension-origin HTML.
 */

import { Interface } from '@ethersproject/abi';
import namehash from 'eth-ens-namehash';

import {
  BNS_DEFAULT_IPFS_GATEWAY_HOST,
  BNS_REGISTRY_RESOLVER_FRAGMENT,
  BNS_RESOLVER_CONTENTHASH_FRAGMENT,
  BNS_SEED_REGISTRY_ADDRESS,
} from './constants';
import { decodeIpfsContenthash } from './contenthash';
import {
  buildTrustedIpfsGatewayUrl,
  isAllowedGatewayUrl,
  normalizeBnesName,
} from './security';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const registryInterface = new Interface([BNS_REGISTRY_RESOLVER_FRAGMENT]);
const resolverInterface = new Interface([BNS_RESOLVER_CONTENTHASH_FRAGMENT]);

/**
 * Low-level eth_call used by the resolver. Callers may inject a quorum
 * implementation or a single-provider mock in tests.
 */
export type BnsEthCall = (args: {
  to: string;
  data: string;
}) => Promise<string>;

export type ResolveBnesContentOptions = {
  /** User input: `bear.bnes`, `bnes://bear.bnes/…`, etc. */
  name: string;
  /** BNS registry address. Defaults to build-time seed if set. */
  registryAddress?: string;
  /** Injected eth_call (required for on-chain resolution). */
  ethCall: BnsEthCall;
  /** Trusted path-gateway host. Defaults to ipfs.bearnetwork.net. */
  gatewayHost?: string;
  /** Optional path retained from a bnes:// URL. */
  path?: string;
};

export type ResolveBnesContentResult = {
  host: string;
  node: string;
  resolver: string;
  contenthash: string;
  cid: string;
  gatewayUrl: string;
};

/**
 * Validate a configured registry address.
 *
 * @param address - Candidate EVM address.
 * @returns Checksum-agnostic lower-case address, or null.
 */
function normalizeAddress(address: string | undefined): string | null {
  if (!address || typeof address !== 'string') {
    return null;
  }
  const value = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return null;
  }
  if (value.toLowerCase() === ZERO_ADDRESS) {
    return null;
  }
  return value.toLowerCase();
}

/**
 * ABI-decode an address eth_call result.
 *
 * @param data - Raw eth_call return data.
 * @returns Address string, or null if empty/invalid.
 */
function decodeAddressResult(data: string): string | null {
  try {
    const [address] = registryInterface.decodeFunctionResult('resolver', data);
    return normalizeAddress(String(address));
  } catch {
    return null;
  }
}

/**
 * ABI-decode a bytes eth_call result (contenthash).
 *
 * @param data - Raw eth_call return data.
 * @returns Hex bytes, or null.
 */
function decodeBytesResult(data: string): string | null {
  try {
    const [bytes] = resolverInterface.decodeFunctionResult('contenthash', data);
    if (bytes === null || bytes === undefined) {
      return null;
    }
    const hex = typeof bytes === 'string' ? bytes : String(bytes);
    if (!hex || hex === '0x') {
      return null;
    }
    return hex.startsWith('0x') ? hex : `0x${hex}`;
  } catch {
    return null;
  }
}

/**
 * Resolve a `.bnes` name to a trusted IPFS gateway URL via contenthash.
 * Fails closed on invalid host, missing registry, empty resolver, or bad CID.
 *
 * @param options - Name, registry, eth_call, and gateway options.
 * @returns Structured resolution result.
 */
export async function resolveBnesContent(
  options: ResolveBnesContentOptions,
): Promise<ResolveBnesContentResult> {
  const host = normalizeBnesName(options.name);
  if (!host) {
    throw new Error('Invalid or disallowed .bnes name');
  }

  const registryAddress = normalizeAddress(
    options.registryAddress ?? BNS_SEED_REGISTRY_ADDRESS,
  );
  if (!registryAddress) {
    throw new Error(
      'BNS registry address is not configured (fail closed until seeded)',
    );
  }

  const gatewayHost = (
    options.gatewayHost ?? BNS_DEFAULT_IPFS_GATEWAY_HOST
  ).trim();
  const node = namehash.hash(host);

  const resolverData = registryInterface.encodeFunctionData('resolver', [node]);
  const resolverRaw = await options.ethCall({
    to: registryAddress,
    data: resolverData,
  });
  const resolver = decodeAddressResult(resolverRaw);
  if (!resolver) {
    throw new Error(`No resolver configured for ${host}`);
  }

  const contenthashData = resolverInterface.encodeFunctionData('contenthash', [
    node,
  ]);
  const contenthashRaw = await options.ethCall({
    to: resolver,
    data: contenthashData,
  });
  const contenthash = decodeBytesResult(contenthashRaw);
  if (!contenthash) {
    throw new Error(`No contenthash set for ${host}`);
  }

  const cid = decodeIpfsContenthash(contenthash);
  if (!cid) {
    throw new Error(`contenthash for ${host} is not a valid IPFS CID payload`);
  }

  const gatewayUrl = buildTrustedIpfsGatewayUrl(
    gatewayHost,
    cid,
    options.path ?? '',
  );
  if (!isAllowedGatewayUrl(gatewayUrl, gatewayHost)) {
    throw new Error('Resolved gateway URL failed origin pin');
  }

  return {
    host,
    node,
    resolver,
    contenthash,
    cid,
    gatewayUrl,
  };
}
