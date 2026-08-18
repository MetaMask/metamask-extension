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
 * @returns `true` when PRF is supported, otherwise `false` or `undefined`.
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

/**
 * Checks whether a passkey authentication response contains a PRF result.
 *
 * @param response - Passkey authentication response.
 * @param response.clientExtensionResults
 * @param response.clientExtensionResults.prf
 * @param response.clientExtensionResults.prf.results
 * @param response.clientExtensionResults.prf.results.first
 * @returns True when a non-empty PRF result is present.
 */
export function hasPasskeyPRFResult(response: {
  clientExtensionResults?: {
    prf?: {
      results?: {
        first?: unknown;
      };
    };
  };
}): boolean {
  const prfFirst = response.clientExtensionResults?.prf?.results?.first;
  return typeof prfFirst === 'string' && prfFirst.length > 0;
}
