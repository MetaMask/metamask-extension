import { PrfClientExtensionResults } from '@metamask/passkey-controller';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

export class PasskeyPRFRequiredError extends Error {
  override readonly name = 'PasskeyPRFRequiredError';

  constructor() {
    super('Passkey setup requires PRF support');
    Object.setPrototypeOf(this, PasskeyPRFRequiredError.prototype);
  }
}

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
 * @returns True when a non-empty PRF result is present.
 */
export function hasPasskeyPRFResult(response: {
  clientExtensionResults?: PrfClientExtensionResults;
}): boolean {
  const prfFirst = response.clientExtensionResults?.prf?.results?.first;
  return typeof prfFirst === 'string' && prfFirst.length > 0;
}

/**
 * Checks whether a passkey registration response confirms PRF support.
 *
 * @param response - Passkey registration response.
 * @param response.clientExtensionResults
 * @returns True when the PRF extension is enabled.
 */
export function hasPasskeyPRFEnabled(response: {
  clientExtensionResults?: PrfClientExtensionResults;
}): boolean {
  return response.clientExtensionResults?.prf?.enabled === true;
}
