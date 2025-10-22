/**
 * Generates an ECDSA key pair for signing deep links for testing purposes.
 */
export async function generateECDSAKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );
}

/**
 * Signs a URL using the ECDSA key pair. Same implementation as in the server
 * side signing application.
 *
 * @param key - The ECDSA private key to use for signing.
 * @param canonicalUrl - The URL to sign.
 * @returns A signed URL with the `sig` and `sig_params` query parameters appended, and the
 * params sorted and canonicalized.
 */
export async function signDeepLink(key: CryptoKey, canonicalUrl: string) {
  const signedUrl = new URL(canonicalUrl);
  const sigParams = [...signedUrl.searchParams.keys()];

  for (const sigParam of sigParams) {
    if (sigParam.includes(',')) {
      throw new Error(
        `Invalid signature parameter '${sigParam}': Signature parameters cannot contain commas`,
      );
    }
  }

  if (sigParams.length) {
    signedUrl.searchParams.append('sig_params', sigParams.join(','));
    signedUrl.searchParams.sort();
  }

  const signed = await globalThis.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signedUrl.toString()),
  );
  const sig = bytesToB64Url(signed);

  signedUrl.searchParams.append('sig', sig);

  return signedUrl.toString();
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 *
 * @param bytes - The ArrayBuffer to convert.
 * @returns A Base64 encoded string representation of the input bytes.
 */
export function bytesToB64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

/**
 * Converts an ArrayBuffer to an un-padded URL-safe Base64 string.
 *
 * @param bytes - The ArrayBuffer to convert.
 * @returns A URL-safe Base64 encoded string representation of the input bytes.
 */
export function bytesToB64Url(bytes: ArrayBuffer): string {
  const b64 = bytesToB64(bytes);
  // un-padded URL-Safe base64
  return b64.replace(/[=]/gu, '').replace(/\+/gu, '-').replace(/\//gu, '_');
}

/**
 * Computes the Cartesian product of multiple arrays.
 *
 * @param sets - An array of arrays, where each inner array contains elements to
 * be combined.
 * @returns
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function cartesianProduct<T extends unknown[][]>(...sets: T) {
  return sets.reduce((a, b) =>
    a.flatMap((d) => b.map((e) => [d, e].flat())),
  ) as {
    [K in keyof T]: T[K] extends (infer U)[] ? U : never;
  }[];
}
