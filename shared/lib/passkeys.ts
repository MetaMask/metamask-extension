/**
 * WebAuthn passkey utilities for MPC wallet verification.
 *
 * These functions MUST run in a UI context (popup, tab, offscreen document)
 * because the WebAuthn API (`navigator.credentials`) is not available in
 * service workers (MV3 background).
 */

/**
 * Result of creating a new passkey credential.
 */
export type PasskeyCredential = {
  /** Base64url-encoded credential raw ID */
  credentialId: string;
  /** Base64url-encoded COSE public key (from getPublicKey()) */
  publicKey: string;
};

/**
 * Result of signing with an existing passkey.
 */
export type PasskeyAssertion = {
  /** Base64url-encoded credential raw ID */
  credentialId: string;
  /** Base64url-encoded authenticator data */
  authenticatorData: string;
  /** Base64url-encoded client data JSON */
  clientDataJSON: string;
  /** Base64url-encoded signature */
  signature: string;
  /** Unix epoch milliseconds embedded in the challenge */
  timestamp: number;
};

/**
 * Base64url-encode an ArrayBuffer.
 *
 * @param buffer - The buffer to encode.
 * @returns Base64url-encoded string.
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/[=]/gu, '');
}

/**
 * Base64url-decode a string to Uint8Array.
 *
 * @param str - Base64url-encoded string.
 * @returns Decoded bytes.
 */
export function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/gu, '+').replace(/_/gu, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

/**
 * Create a new passkey (WebAuthn credential) for MPC wallet verification.
 *
 * Must be called from a UI context with user gesture.
 *
 * @param rpName - Relying party display name.
 * @returns The credential ID and public key, both base64url-encoded.
 */
export async function createPasskey(
  rpName = 'MetaMask MPC Wallet',
): Promise<PasskeyCredential> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: rpName },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'mpc-wallet-user',
        displayName: 'MPC Wallet User',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256 (P-256)
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      timeout: 60000,
    },
  })) as PublicKeyCredential;

  const response =
    credential.response as AuthenticatorAttestationResponse;
  const publicKeyBytes = response.getPublicKey();
  if (!publicKeyBytes) {
    throw new Error('Failed to extract public key from passkey credential');
  }

  return {
    credentialId: base64UrlEncode(credential.rawId),
    publicKey: base64UrlEncode(publicKeyBytes),
  };
}

/**
 * Encode a Unix-epoch millisecond timestamp as an 8-byte big-endian
 * Uint8Array suitable for use as a WebAuthn challenge.
 *
 * @param ms - Milliseconds since epoch (defaults to `Date.now()`).
 * @returns 8-byte Uint8Array.
 */
function timestampToChallenge(ms: number = Date.now()): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(ms));
  return new Uint8Array(buf);
}

/**
 * Create a WebAuthn assertion (signature) using an existing passkey.
 *
 * The challenge is derived from the current timestamp (`Date.now()`) so
 * verifiers can extract it from `clientDataJSON` and enforce a freshness
 * window.
 *
 * Must be called from a UI context with user gesture.
 *
 * @param credentialId - Base64url-encoded credential ID from a previous
 *   `createPasskey()` call.
 * @returns The assertion data, with all binary fields base64url-encoded and
 *   the `timestamp` (ms) that was embedded in the challenge.
 */
export async function signWithPasskey(
  credentialId: string,
): Promise<PasskeyAssertion> {
  const now = Date.now();
  const challenge = timestampToChallenge(now);

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          type: 'public-key',
          id: base64UrlDecode(credentialId),
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  })) as PublicKeyCredential;

  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    credentialId: base64UrlEncode(assertion.rawId),
    authenticatorData: base64UrlEncode(response.authenticatorData),
    clientDataJSON: base64UrlEncode(response.clientDataJSON),
    signature: base64UrlEncode(response.signature),
    timestamp: now,
  };
}
