import { MockedEndpoint, Mockttp } from 'mockttp';
import { StellarNode } from './node';

/**
 * Infura Stellar Soroban RPC (any project id).
 */
export const STELLAR_INFURA_RPC_URL =
  /^https:\/\/stellar-mainnet\.infura\.io\/v3\/[^/]+$/u;

/**
 * Infura Stellar Horizon (any project id + path).
 */
export const STELLAR_INFURA_HORIZON_URL =
  /^https:\/\/stellar-mainnet\.infura\.io\/v3\/[^/]+\/horizon(\/.*)?$/u;

/**
 * Rewrites an Infura Horizon URL to the path + query the local Quickstart
 * Horizon expects (`/horizon` prefix stripped).
 *
 * @param infuraUrl - Full Infura Horizon URL
 * @returns Local Horizon path including search, e.g. `/accounts/G…?cursor=1`
 */
export function extractHorizonPathFromInfuraUrl(infuraUrl: string): string {
  const parsed = new URL(infuraUrl);
  const match = parsed.pathname.match(/\/horizon(\/.*)?$/u);
  const path = match?.[1] && match[1].length > 0 ? match[1] : '/';
  return `${path}${parsed.search}`;
}

/**
 * Proxies Infura Stellar Horizon + RPC to a running Quickstart container.
 * Account bodies come from the node — this is routing, not a balance fixture.
 *
 * @param mockServer - Mockttp server
 * @param stellarNode - Started {@link StellarNode}
 * @returns Registered mock endpoints
 */
export async function proxyStellarBlockchainCalls(
  mockServer: Mockttp,
  stellarNode: StellarNode,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(STELLAR_INFURA_RPC_URL)
      .always()
      .thenCallback(async (request) => {
        const body = await request.body.getText();
        return proxyTo(stellarNode.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      }),
    await mockServer
      .forGet(STELLAR_INFURA_HORIZON_URL)
      .always()
      .thenCallback(async (request) => {
        const path = extractHorizonPathFromInfuraUrl(request.url);
        return proxyTo(`${stellarNode.horizonUrl}${path}`);
      }),
    await mockServer
      .forPost(STELLAR_INFURA_HORIZON_URL)
      .always()
      .thenCallback(async (request) => {
        const path = extractHorizonPathFromInfuraUrl(request.url);
        const body = await request.body.getText();
        return proxyTo(`${stellarNode.horizonUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type':
              request.headers['content-type'] ?? 'application/json',
          },
          body,
        });
      }),
  ];
}

async function proxyTo(
  url: string,
  init?: RequestInit,
): Promise<{ json?: unknown; body?: string; statusCode: number }> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  try {
    return {
      statusCode: response.status,
      json: text ? JSON.parse(text) : undefined,
    };
  } catch {
    return { statusCode: response.status, body: text };
  }
}
