import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

/**
 * Whether this client can use WebAuthn at all (sync hint for UI).
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Whether this client reports support for PRF-backed passkeys.
 *
 * @returns Known support when the browser exposes capability data; otherwise `undefined`
 * so callers can still try a ceremony and handle failure if needed.
 */
export async function isPasskeyPRFSupported(): Promise<boolean | undefined> {
  if (!browserSupportsWebAuthn()) {
    return false;
  }

  const publicKeyCredentialWithCapabilities =
    PublicKeyCredential as typeof PublicKeyCredential & {
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    };

  if (
    typeof publicKeyCredentialWithCapabilities.getClientCapabilities ===
    'function'
  ) {
    const caps =
      await publicKeyCredentialWithCapabilities.getClientCapabilities();
    return caps['extension:prf'] === true;
  }

  return undefined;
}
