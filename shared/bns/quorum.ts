/**
 * Three-endpoint, two-of-three eth_call quorum for BNS reads.
 *
 * Fail-closed: fewer than two identical successful results rejects the call.
 * This is pure JSON-RPC over fetch — no ethers FallbackProvider fuzzy modes.
 */

import {
  BNS_CHAIN_ID_DECIMAL,
  BNS_DEFAULT_RPC_TIMEOUT_MS,
  BNS_READ_RPC_URLS,
  BNS_RPC_QUORUM,
} from './constants';

export type JsonRpcEthCallRequest = {
  to: string;
  data: string;
};

export type QuorumFetch = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export type EthCallQuorumOptions = {
  rpcUrls?: readonly string[];
  chainId?: number;
  timeoutMs?: number;
  quorum?: number;
  fetchImpl?: QuorumFetch;
};

/**
 * Ensure RPC endpoints are exactly three unique canonical HTTPS origins.
 *
 * @param rpcUrls - Candidate RPC URLs.
 * @returns Normalized origins.
 */
export function assertBnsReadRpcUrls(
  rpcUrls: readonly string[],
): readonly string[] {
  if (rpcUrls.length !== 3 || new Set(rpcUrls).size !== 3) {
    throw new Error('BNS resolution requires exactly three unique RPC endpoints');
  }
  return rpcUrls.map((value) => {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      (url.pathname !== '/' && url.pathname !== '') ||
      url.search ||
      url.hash
    ) {
      throw new Error(`RPC endpoint must be a canonical HTTPS origin: ${value}`);
    }
    return url.origin;
  });
}

/**
 * Perform eth_call against three RPCs and require quorum agreement on the
 * returned data hex string (case-insensitive).
 *
 * @param request - Target contract and calldata.
 * @param options - Endpoint list, timeout, and injectable fetch.
 * @returns The agreed data hex string.
 */
export async function ethCallWithQuorum(
  request: JsonRpcEthCallRequest,
  options: EthCallQuorumOptions = {},
): Promise<string> {
  const rpcUrls = assertBnsReadRpcUrls(options.rpcUrls ?? BNS_READ_RPC_URLS);
  const timeoutMs = options.timeoutMs ?? BNS_DEFAULT_RPC_TIMEOUT_MS;
  const quorum = options.quorum ?? BNS_RPC_QUORUM;
  const chainId = options.chainId ?? BNS_CHAIN_ID_DECIMAL;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('RPC timeout must be a positive integer');
  }
  if (!Number.isInteger(quorum) || quorum < 1 || quorum > rpcUrls.length) {
    throw new Error('Invalid quorum configuration');
  }
  if (!request.to || !request.data) {
    throw new Error('eth_call requires to and data');
  }

  const results = await Promise.all(
    rpcUrls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetchImpl(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_call',
              params: [
                { to: request.to, data: request.data },
                'latest',
              ],
            }),
            signal: controller.signal,
          });
          if (!response.ok) {
            return { ok: false as const, reason: `http ${response.status}` };
          }
          const body = (await response.json()) as {
            result?: string;
            error?: { message?: string };
          };
          if (body.error || typeof body.result !== 'string') {
            return {
              ok: false as const,
              reason: body.error?.message || 'missing result',
            };
          }
          return { ok: true as const, result: body.result.toLowerCase() };
        } finally {
          clearTimeout(timer);
        }
      } catch (error) {
        return {
          ok: false as const,
          reason: error instanceof Error ? error.message : 'fetch failed',
        };
      }
    }),
  );

  const tally = new Map<string, number>();
  for (const entry of results) {
    if (!entry.ok) {
      continue;
    }
    tally.set(entry.result, (tally.get(entry.result) ?? 0) + 1);
  }

  for (const [value, count] of tally.entries()) {
    if (count >= quorum) {
      return value.startsWith('0x') ? value : `0x${value}`;
    }
  }

  throw new Error(
    `BNS eth_call quorum not met on chain ${chainId}: ${JSON.stringify(
      results.map((entry, index) => ({
        url: rpcUrls[index],
        ...entry,
      })),
    )}`,
  );
}
