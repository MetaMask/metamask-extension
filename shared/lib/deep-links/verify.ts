import { getManifestFlags } from '../manifestFlags';
import { canonicalize } from './canonicalize';

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64StringToBytes(unpaddedBase64: string) {
  let standardB64 = unpaddedBase64.replace(/-/gu, '+').replace(/_/gu, '/');
  // Add padding if needed
  const pad = standardB64.length % 4;
  if (pad === 2) {
    standardB64 += '==';
  } else if (pad === 3) {
    standardB64 += '=';
  }

  // Decode to bytes
  const binaryString = atob(standardB64);
  return Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
}

export const MISSING = 'MISSING' as const;
export const VALID = 'VALID' as const;
export const INVALID = 'INVALID' as const;

let tools: { algorithm: EcdsaParams; encoder: TextEncoder; key: CryptoKey };
async function lazyGetTools() {
  if (tools) {
    return tools;
  }
  const algorithm = { name: 'ECDSA', hash: 'SHA-256' } as EcdsaParams;

  let pubKey = base64ToArrayBuffer(process.env.DEEP_LINK_PUBLIC_KEY as string);
  if (process.env.IN_TEST) {
    const testKey = getManifestFlags().testing?.deepLinkPublicKey;
    if (testKey) {
      console.log(
        'IN_TEST: Using deep link public key found key at `getManifestFlags().testing?.deepLinkPublicKey`',
      );
      pubKey = base64ToArrayBuffer(testKey);
    }
  }

  const key = await crypto.subtle.importKey(
    'spki',
    pubKey,
    { name: algorithm.name, namedCurve: 'P-256' },
    false, // extractable
    ['verify'],
  );

  tools = {
    algorithm,
    encoder: new TextEncoder(),
    key,
  };
  return tools;
}

export const verify = async (url: URL) => {
  const signatureStr = url.searchParams.get('sig');
  if (!signatureStr) {
    return MISSING;
  }
  const signature = base64StringToBytes(signatureStr);

  if (signature.length !== 64) {
    console.error('Invalid signature length:', signature.length);
    return INVALID;
  }

  const { algorithm, encoder, key } = await lazyGetTools();

  const canonicalUrl = canonicalize(url);
  const data = encoder.encode(canonicalUrl);

  const ok = await crypto.subtle.verify(algorithm, key, signature, data);
  return ok ? VALID : INVALID;
};
