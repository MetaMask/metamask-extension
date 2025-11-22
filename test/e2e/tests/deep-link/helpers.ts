import { canonicalize } from '../../../../shared/lib/deep-links/canonicalize';
import {
  SIG_PARAM,
  SIG_PARAMS_PARAM,
} from '../../../../shared/lib/deep-links/constants';

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
 * Signs a URL using the ECDSA key pair.
 *
 * @param key
 * @param url - The URL to sign.
 * @param withSigParams - Whether to include the `sig_params` query parameter.
 * @returns A signed URL with the `sig` and `sig_params` query parameters appended, and the
 * params sorted and canonicalized.
 */
export async function signDeepLink(
  key: CryptoKey,
  url: string,
  withSigParams = true,
) {
  const canonicalUrl = canonicalize(new URL(url));
  const signedUrl = new URL(canonicalUrl);

  if (withSigParams) {
    const sigParams = [...new Set(signedUrl.searchParams.keys())];

    signedUrl.searchParams.append(SIG_PARAMS_PARAM, sigParams.join(','));
    signedUrl.searchParams.sort();
  }

  const signed = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signedUrl.toString()),
  );
  const sig = bytesToB64Url(signed);

  signedUrl.searchParams.append(SIG_PARAM, sig);

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

export function getHashParams(url: URL) {
  const hash = url.hash.slice(1); // remove leading '#'
  const hashQuery = hash.split('?')[1] ?? '';
  const hashParams = new URLSearchParams(hashQuery);
  const encodedUrl = hashParams.get('u') ?? '';
  const decodedUrl = decodeURIComponent(encodedUrl);
  const decodedQuery = decodedUrl.split('?')[1] ?? '';
  return new URLSearchParams(decodedQuery);
}
