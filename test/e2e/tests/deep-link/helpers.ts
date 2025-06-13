import { canonicalize } from '../../../../shared/lib/deep-links/canonicalize';

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
 * @param key
 * @param url - The URL to sign.
 * @returns A signed URL with the `sig` query parameter appended, and the
 * params sorted and canonicalized.
 */
export async function signDeepLink(key: CryptoKey, url: string) {
  const canonical = canonicalize(new URL(url));
  const signed = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(canonical),
  );
  const sig = bytesToB64Url(signed);
  const signedUrl = new URL(canonical);
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
export function cartesianProduct<T extends unknown[][]>(...sets: T) {
  return sets.reduce((a, b) =>
    a.flatMap((d) => b.map((e) => [d, e].flat())),
  ) as {
    [K in keyof T]: T[K] extends (infer U)[] ? U : never;
  }[];
}
