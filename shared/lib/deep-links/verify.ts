import { canonicalize } from './canonicalize';
import { SIG_PARAM } from './constants';
import { getKeyData, sigToBytes } from './helpers';

export const MISSING = 'missing' as const;
export const VALID = 'valid' as const;
export const INVALID = 'invalid' as const;

export type SignatureStatus = typeof MISSING | typeof VALID | typeof INVALID;

let tools: {
  algorithm: EcdsaParams;
  encoder: TextEncoder;
  publicKey: CryptoKey;
};

/**
 * Lazy loads the tools needed for verifying deep links.
 * This is done to avoid loading the crypto module and importing the key data
 * until it's actually needed, which can help with performance
 * and reduce the initial load time of the application.
 */
async function lazyGetTools() {
  const algorithm: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

  const publicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    getKeyData(),
    { name: algorithm.name, namedCurve: 'P-256' },
    false, // extractable
    ['verify'],
  );

  tools = {
    algorithm,
    encoder: new TextEncoder(),
    publicKey,
  };
  return tools;
}

/**
 * Verifies the signature of a deep link URL.
 * This function checks if the URL contains a valid signature
 * and returns the status of the verification.
 *
 * @param url - The URL to verify.
 */
export const verify = async (url: URL) => {
  const signatureStr = url.searchParams.get(SIG_PARAM);
  if (!signatureStr) {
    return MISSING;
  }

  const { algorithm, encoder, publicKey } = tools || (await lazyGetTools());

  const signature = sigToBytes(signatureStr);
  const data = encoder.encode(canonicalize(url));

  const ok = await crypto.subtle.verify(algorithm, publicKey, signature, data);
  return ok ? VALID : INVALID;
};
