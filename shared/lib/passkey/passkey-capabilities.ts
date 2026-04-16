import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';

export type PasskeyCapabilities = {
  webAuthnSupported: boolean;
  /**
   * Whether a built-in authenticator (Touch ID, Windows Hello, Android
   * biometrics, etc.) is available on the device.
   */
  platformAuthenticatorAvailable: boolean;
  /**
   * `true` when the client confirms PRF support, `false` when it
   * confirms PRF is *not* supported, `undefined` when the check is
   * unavailable (include PRF optimistically in that case).
   */
  prfSupported: boolean | undefined;
};

/**
 * Probes the current browser/platform for WebAuthn support, platform
 * authenticator availability, and PRF extension support.
 *
 * PRF detection uses `PublicKeyCredential.getClientCapabilities()`
 * (Baseline 2025). When that API is unavailable, `prfSupported` is
 * returned as `undefined` -- callers should include PRF optimistically
 * and let the post-ceremony fallback in `key-derivation.ts` handle the
 * result.
 *
 * @returns Resolved capabilities for the current environment.
 */
export async function checkPasskeyCapabilities(): Promise<PasskeyCapabilities> {
  if (!browserSupportsWebAuthn()) {
    return {
      webAuthnSupported: false,
      platformAuthenticatorAvailable: false,
      prfSupported: false,
    };
  }

  const platformAuthenticatorAvailable =
    await platformAuthenticatorIsAvailable();

  if (typeof PublicKeyCredential.getClientCapabilities === 'function') {
    const caps = await PublicKeyCredential.getClientCapabilities();
    const prfSupported = caps['extension:prf'] === true;
    return {
      webAuthnSupported: true,
      platformAuthenticatorAvailable,
      prfSupported,
    };
  }

  return {
    webAuthnSupported: true,
    platformAuthenticatorAvailable,
    prfSupported: undefined,
  };
}
