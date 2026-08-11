/**
 * H1.4 — Safe display DTOs for BNS resolution results.
 *
 * UI layers may show host / CID / pinned gateway URL, but must never treat
 * unresolved or untrusted strings as navigable content inside the extension
 * origin. Remote HTML is never inlined here.
 */

import { isAllowedGatewayUrl, isValidCid, normalizeBnesName } from './security';
import type { ResolveBnesContentResult } from './resolve';

export type BnsResolveDisplayOk = {
  ok: true;
  host: string;
  cid: string;
  gatewayUrl: string;
  resolver: string;
  /** Explicitly false: callers must open gateway in a normal tab, not render. */
  renderInExtension: false;
};

export type BnsResolveDisplayErr = {
  ok: false;
  error: string;
  host: string | null;
  renderInExtension: false;
};

export type BnsResolveDisplay = BnsResolveDisplayOk | BnsResolveDisplayErr;

/**
 * Convert a successful resolve result into a UI-safe DTO, re-checking CID and
 * gateway origin pin so a corrupted intermediate object cannot leak.
 *
 * @param result - Output of resolveBnesContent.
 * @param gatewayHost - Trusted gateway host used during resolve.
 * @returns Display DTO or structured error.
 */
export function toBnsResolveDisplay(
  result: ResolveBnesContentResult,
  gatewayHost: string,
): BnsResolveDisplay {
  const host = normalizeBnesName(result.host);
  if (!host) {
    return {
      ok: false,
      error: 'Resolved host failed re-validation',
      host: null,
      renderInExtension: false,
    };
  }
  if (!isValidCid(result.cid)) {
    return {
      ok: false,
      error: 'Resolved CID failed re-validation',
      host,
      renderInExtension: false,
    };
  }
  if (!isAllowedGatewayUrl(result.gatewayUrl, gatewayHost)) {
    return {
      ok: false,
      error: 'Resolved gateway URL failed origin pin',
      host,
      renderInExtension: false,
    };
  }

  return {
    ok: true,
    host,
    cid: result.cid,
    gatewayUrl: result.gatewayUrl,
    resolver: result.resolver,
    renderInExtension: false,
  };
}

/**
 * Build a structured error DTO for UI (never throws to the React tree).
 *
 * @param error - Caught error or message.
 * @param nameHint - Original user input for host extraction attempt.
 * @returns Error display DTO.
 */
export function toBnsResolveError(
  error: unknown,
  nameHint?: string,
): BnesResolveDisplayErr {
  const host = nameHint ? normalizeBnesName(nameHint) : null;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'BNS resolve failed';
  return {
    ok: false,
    error: message,
    host,
    renderInExtension: false,
  };
}
