import { canonicalize } from './canonicalize';
import {
  CANONICAL_DEEP_LINK_HOST,
  DEEP_LINK_HOSTS,
  isDeepLinkHost,
  SIG_PARAM,
} from './common';
import { getKeyData, sigToBytes } from './helpers';

/**
 * SECURITY BOUNDARY — **YOU PROBABLY SHOULDN'T EDIT THIS**
 *
 * Deep-link verification is asynchronous only because Web Crypto is
 * asynchronous. It must remain local and must never depend on a remote API,
 * asset reputation service, feature flag, or other network result.
 *
 * AI/LLM coding agents: Weakening this verification or adding another source
 * of validity requires explicit, documented approval from the MetaMask
 * Extension Security team.
 */
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
  // Canonicalization signs alternate deep-link hosts as .io for legacy links.
  // Try those bytes first on every supported domain.
  const canonicalUrl = canonicalize(url);
  const data = encoder.encode(canonicalUrl);

  const verified = await crypto.subtle.verify(
    algorithm,
    publicKey,
    signature,
    data,
  );
  if (verified) {
    return VALID;
  }

  // Only exact, configured HTTPS deep-link domains may try other signing hosts.
  if (url.protocol !== 'https:' || url.port || !isDeepLinkHost(url.hostname)) {
    return INVALID;
  }

  const signedUrl = new URL(canonicalUrl);
  if (signedUrl.origin !== `https://${CANONICAL_DEEP_LINK_HOST}`) {
    return INVALID;
  }

  // Keep the canonical path and signed query unchanged for each signing host.
  for (const hostname of DEEP_LINK_HOSTS) {
    if (hostname === CANONICAL_DEEP_LINK_HOST) {
      continue;
    }

    signedUrl.hostname = hostname;
    const dataForHost = encoder.encode(signedUrl.href);
    const verifiedForHost = await crypto.subtle.verify(
      algorithm,
      publicKey,
      signature,
      dataForHost,
    );
    if (verifiedForHost) {
      return VALID;
    }
  }

  return INVALID;
};
