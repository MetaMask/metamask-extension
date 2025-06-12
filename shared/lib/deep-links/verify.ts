import { canonicalize } from './canonicalize';
import { getKeyData, sigToBytes } from './helpers';

export const MISSING = 'MISSING' as const;
export const VALID = 'VALID' as const;
export const INVALID = 'INVALID' as const;

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
export async function lazyGetTools() {
  const algorithm: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

  const publicKey = await crypto.subtle.importKey(
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

export const verify = async (url: URL) => {
  const signatureStr = url.searchParams.get('sig');
  if (!signatureStr) {
    return MISSING;
  }

  const { algorithm, encoder, publicKey } = tools || (await lazyGetTools());

  const signature = sigToBytes(signatureStr);
  const data = encoder.encode(canonicalize(url));

  const ok = await crypto.subtle.verify(algorithm, publicKey, signature, data);
  return ok ? VALID : INVALID;
};
