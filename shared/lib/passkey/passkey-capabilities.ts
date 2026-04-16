import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

/**
 * Synchronous check: does this browser support WebAuthn?
 * Use for feature gating (show/hide UI). For full capability
 * detection (PRF support), use {@link isPasskeyPRFSupported}.
 *
 * @returns Whether the browser supports the WebAuthn API.
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Checks whether the browser/platform supports the WebAuthn PRF extension.
 *
 * Uses `PublicKeyCredential.getClientCapabilities()` (Baseline 2025).
 * When that API is unavailable, returns `undefined` -- callers should
 * include PRF optimistically and let the post-ceremony fallback in
 * `key-derivation.ts` handle the result.
 *
 * @returns `true` when PRF is confirmed available, `false` when confirmed
 * unavailable, `undefined` when detection is not possible.
 */
export async function isPasskeyPRFSupported(): Promise<boolean | undefined> {
  if (!browserSupportsWebAuthn()) {
    return false;
  }

  if (typeof PublicKeyCredential.getClientCapabilities === 'function') {
    const caps = await PublicKeyCredential.getClientCapabilities();
    return caps['extension:prf'] === true;
  }

  return undefined;
}
