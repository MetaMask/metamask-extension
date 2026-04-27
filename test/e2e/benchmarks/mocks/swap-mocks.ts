/**
 * Swap benchmark mock setup for pass-through mode.
 *
 * In mockttp's HTTPS proxy mode, separate mock rules (`.forGet()`,
 * `.matching()`, `.thenStream()`, etc.) do NOT intercept proxied
 * HTTPS requests. The only reliable interception point is the
 * `beforeRequest` callback inside the single `thenPassThrough()`
 * handler registered by `setupMockingPassThrough`.
 *
 * This module registers a pass-through interceptor that mocks the
 * specific URLs needed for the swap benchmark while letting
 * everything else pass through to real servers.
 */

import type { Mockttp } from 'mockttp';
import { setPassThroughInterceptor } from '../../mock-e2e-pass-through';
import { BRIDGE_FEATURE_FLAGS, CLIENT_CONFIG_FLAGS } from './mock-responses';
import bridgeNetworkTokens from './bridge-network-tokens.json';
import bridgeTokens from './bridge-tokens.json';
import bridgeTokensPopular from './bridge-tokens-popular.json';
import bridgeTokensSearch from './bridge-tokens-search.json';
import swapQuoteEthUsdc from './swap-quote-eth-usdc.json';
import swapQuoteSolUsdc from './swap-quote-sol-usdc.json';

const SOLANA_CHAIN_ID = '1151111081099710';

/**
 * Build a static SSE response body from an array of quote events.
 *
 * @param events - Quote payloads to include
 * @returns SSE-formatted string body
 */
export function buildSseResponseBody(events: unknown[]): string {
  return events
    .map(
      (quote, i) =>
        `event: quote\nid: ${Date.now()}-${i + 1}\ndata: ${JSON.stringify(quote)}\n\n`,
    )
    .join('');
}

/**
 * Selects the deterministic quote fixture that matches the bridge request URL.
 *
 * @param url - Swap/bridge request URL.
 * @returns The Solana or Ethereum quote fixture for that request.
 */
function getBenchmarkSwapQuote(url: string) {
  return url.includes(`srcChainId=${SOLANA_CHAIN_ID}`)
    ? swapQuoteSolUsdc
    : swapQuoteEthUsdc;
}

/**
 * Returns a benchmark swap mock response for recognized bridge API requests.
 *
 * @param req - Request metadata from the pass-through interceptor.
 * @param req.url
 * @param req.method
 * @returns A mock response for handled URLs, or `null` when the request should pass through.
 */
export function getSwapBenchmarkInterceptorResponse(req: {
  url: string;
  method: string;
}): { response: Record<string, unknown> } | null {
  // Bridge feature flags (enables SSE + Solana chain)
  if (req.url.includes('bridge.api.cx.metamask.io/featureFlags')) {
    return {
      response: {
        statusCode: BRIDGE_FEATURE_FLAGS.statusCode,
        headers: { 'content-type': 'application/json' },
        json: BRIDGE_FEATURE_FLAGS.json,
      },
    };
  }

  // Client-config feature flags (enables SSE + Solana chain)
  if (req.url.includes('client-config.api.cx.metamask.io/v1/flags')) {
    return {
      response: {
        statusCode: CLIENT_CONFIG_FLAGS.statusCode,
        headers: { 'content-type': 'application/json' },
        json: CLIENT_CONFIG_FLAGS.json,
      },
    };
  }

  if (
    req.method === 'POST' &&
    req.url.includes('bridge.api.cx.metamask.io/getTokens/popular')
  ) {
    return {
      response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        json: bridgeTokensPopular,
      },
    };
  }

  if (
    req.method === 'POST' &&
    req.url.includes('bridge.api.cx.metamask.io/getTokens/search')
  ) {
    return {
      response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        json: bridgeTokensSearch,
      },
    };
  }

  if (
    req.url.includes('bridge.api.cx.metamask.io/networks/') &&
    req.url.includes('/tokens')
  ) {
    return {
      response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        json: bridgeNetworkTokens,
      },
    };
  }

  if (req.url.includes('bridge.api.cx.metamask.io/getTokens')) {
    return {
      response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        json: bridgeTokens,
      },
    };
  }

  // getQuoteStream SSE endpoint
  if (req.url.includes('getQuoteStream')) {
    return {
      response: {
        statusCode: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: buildSseResponseBody([getBenchmarkSwapQuote(req.url)]),
      },
    };
  }

  // getQuote REST endpoint (non-SSE fallback) — the extension may
  // use getQuote instead of getQuoteStream when the SSE feature
  // flag or version check does not pass in the current build.
  if (
    req.url.includes('bridge.api.cx.metamask.io/getQuote') &&
    !req.url.includes('getQuoteStream')
  ) {
    return {
      response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        json: [getBenchmarkSwapQuote(req.url)],
      },
    };
  }

  // Not handled by this interceptor
  return null;
}

/**
 * Register a pass-through interceptor that mocks specific URLs
 * needed for the swap benchmark while letting everything else
 * pass through to real servers.
 *
 * @param mockServer - The Mockttp server instance
 */
export function registerSwapInterceptor(mockServer: Mockttp): void {
  setPassThroughInterceptor(mockServer, getSwapBenchmarkInterceptorResponse);
}
