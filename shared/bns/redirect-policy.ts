/**
 * H1.5 — Pure redirect policy for BNS navigation.
 *
 * Decides whether a failed main_frame navigation to a `.bnes` host may be
 * rewritten to a trusted path-style IPFS gateway. Never authorizes rendering
 * remote HTML inside the chrome-extension origin.
 */

import type { BnsResolveDisplay } from './display';
import {
  isAllowedBnesHost,
  isAllowedGatewayUrl,
  isValidCid,
  normalizeBnesName,
} from './security';

export type BnsRedirectDecision =
  | {
      action: 'redirect';
      url: string;
      host: string;
      cid: string;
      /** Always false: tab must open a normal HTTPS gateway URL. */
      renderInExtension: false;
    }
  | {
      action: 'abort';
      reason: string;
      host: string | null;
      renderInExtension: false;
    };

/**
 * Parse a navigation URL and return a normalized `.bnes` host if it is a
 * candidate for BNS redirect handling.
 *
 * @param urlValue - Failed request URL from webRequest.
 * @returns Normalized host, or null if not a BNS candidate.
 */
export function extractBnesHostFromNavigationUrl(
  urlValue: string,
): string | null {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!isAllowedBnesHost(host)) {
    return null;
  }
  return normalizeBnesName(host);
}

/**
 * Path retained from the original navigation (pathname only).
 * Query and fragment are dropped so the gateway URL stays within the origin
 * pin (`isAllowedGatewayUrl` forbids search/hash).
 *
 * @param urlValue - Failed request URL.
 * @returns Path segment for gateway append, or empty string.
 */
export function extractPathFromNavigationUrl(urlValue: string): string {
  try {
    const url = new URL(urlValue);
    return url.pathname === '/' ? '' : url.pathname;
  } catch {
    return '';
  }
}

/**
 * Given a UI-safe display DTO, decide whether a tab may be redirected to the
 * pinned gateway URL. Malicious or unpinned targets are aborted.
 *
 * @param display - Output of toBnsResolveDisplay / resolveBnesForUi.
 * @param trustedGatewayHost - Bare trusted gateway hostname.
 * @returns Redirect decision (never allows extension-origin render).
 */
export function decideBnsTabRedirect(
  display: BnsResolveDisplay,
  trustedGatewayHost: string,
): BnsRedirectDecision {
  if (display.renderInExtension !== false) {
    return {
      action: 'abort',
      reason: 'Rendering BNS content inside the extension origin is forbidden',
      host: display.host,
      renderInExtension: false,
    };
  }

  if (!display.ok) {
    return {
      action: 'abort',
      reason: display.error,
      host: display.host,
      renderInExtension: false,
    };
  }

  if (!isAllowedBnesHost(display.host)) {
    return {
      action: 'abort',
      reason: 'Resolved host failed security re-check',
      host: display.host,
      renderInExtension: false,
    };
  }

  if (!isValidCid(display.cid)) {
    return {
      action: 'abort',
      reason: 'Resolved CID failed structural re-check',
      host: display.host,
      renderInExtension: false,
    };
  }

  if (!isAllowedGatewayUrl(display.gatewayUrl, trustedGatewayHost)) {
    return {
      action: 'abort',
      reason: 'Gateway URL failed trusted origin pin',
      host: display.host,
      renderInExtension: false,
    };
  }

  // Extra belt: only absolute HTTPS destinations leave this policy.
  if (!display.gatewayUrl.startsWith('https://')) {
    return {
      action: 'abort',
      reason: 'Only HTTPS trusted-gateway redirects are allowed',
      host: display.host,
      renderInExtension: false,
    };
  }

  if (
    display.gatewayUrl.startsWith('chrome-extension:') ||
    display.gatewayUrl.startsWith('moz-extension:') ||
    display.gatewayUrl.startsWith('data:') ||
    display.gatewayUrl.startsWith('blob:')
  ) {
    return {
      action: 'abort',
      reason: 'Extension or opaque-origin destinations are forbidden',
      host: display.host,
      renderInExtension: false,
    };
  }

  return {
    action: 'redirect',
    url: display.gatewayUrl,
    host: display.host,
    cid: display.cid,
    renderInExtension: false,
  };
}
