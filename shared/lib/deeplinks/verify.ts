function base64StringToBytes(unpaddedBase64: string) {
  let standardB64 = unpaddedBase64.replace(/-/g, '+').replace(/_/g, '/');
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

function canonicalize(url: URL): string {
  // delete params so we don't edit the original URL
  const params = new URLSearchParams(url.searchParams);
  params.delete('sig');
  params.sort();
  const queryString = params.toString();
  const fullUrl =
    url.origin + url.pathname + (queryString ? `?${queryString}` : '');
  return fullUrl;
}

export const MISSING = 'MISSING' as const;
export const VALID = 'VALID' as const;
export const INVALID = 'INVALID' as const;

let tools: { algorithm: EcdsaParams; encoder: TextEncoder; key: CryptoKey };
async function lazyGetTools() {
  if (tools) {
    return tools;
  }
  const curve = 'P-256' as NamedCurve;
  const algorithm = { name: 'ECDSA', hash: 'SHA-256' } as EcdsaParams;
  const keyUsage = ['verify'] as KeyUsage[];
  const key = await crypto.subtle.importKey(
    'jwk',
    {
      crv: curve,
      ext: true,
      key_ops: keyUsage,
      kty: 'EC',
      x: 'Bhp73TQ0keNmZWmdPlT7U3dbqbvZRdywIe5RpVFwIuk',
      y: '4BFtBenx-ZjECrt6YUNRk4isSBTAFMn_21vDiFgI7h8',
    },
    { name: algorithm.name, namedCurve: curve },
    false, // extractable
    keyUsage,
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
