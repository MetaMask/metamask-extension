import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

/**
 * Whether WebAuthn is available (sync gate for UI).
 * For PRF specifically, use {@link isPasskeyPRFSupported}.
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Whether the WebAuthn PRF extension is supported (`extension:prf` via
 * `PublicKeyCredential.getClientCapabilities()` when present).
 *
 * @returns `true` / `false` when known, or `undefined` if that API is missing
 * (callers may still attempt PRF and handle failure after the ceremony).
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
