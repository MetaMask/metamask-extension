import type { RandomNumberGenerator } from '@metamask/mfa-wallet-interface';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as secp256k1 from '@noble/secp256k1';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ed25519 from '@noble/ed25519';
import { DEV_JWT_PRIVATE_KEY } from '../constants';

/**
 * Browser-compatible random number generator using crypto.getRandomValues
 */
export class BrowserRandomNumberGenerator implements RandomNumberGenerator {
  generateRandomBytes(size: number): Uint8Array {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytes;
  }
}

/**
 * Create a unique session ID
 */
export function createSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Base64URL encode data
 */
export function base64UrlEncode(data: Uint8Array | string): string {
  const bytes =
    typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const base64 = btoa(String.fromCharCode(...bytes));
  const plusPattern = /\+/gu;
  const slashPattern = /\u002f/gu;
  // eslint-disable-next-line no-div-regex
  const equalsPattern = /=+$/u;
  return base64
    .replace(plusPattern, '-')
    .replace(slashPattern, '_')
    .replace(equalsPattern, '');
}

/**
 * Parse PEM private key to raw bytes
 */
function pemToRaw(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN EC PRIVATE KEY-----/u, '')
    .replace(/-----END EC PRIVATE KEY-----/u, '')
    .replace(/\s/gu, '');
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Import EC private key for signing
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const raw = pemToRaw(pem);
  const privateKeyBytes = raw.slice(7, 39);
  const publicKeyStart = raw.indexOf(0x04, 50);
  const xBytes = raw.slice(publicKeyStart + 1, publicKeyStart + 33);
  const yBytes = raw.slice(publicKeyStart + 33, publicKeyStart + 65);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: base64UrlEncode(privateKeyBytes),
    x: base64UrlEncode(xBytes),
    y: base64UrlEncode(yBytes),
  };

  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign'],
  );
}

/**
 * Generate JWT token for Centrifugo authentication
 */
export async function generateCentrifugoToken(partyId: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    sub: partyId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    channels: ['*'],
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(DEV_JWT_PRIVATE_KEY);
  const dataToSign = new TextEncoder().encode(signingInput);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    dataToSign.buffer as ArrayBuffer,
  );

  const signature = new Uint8Array(signatureBuffer);
  const encodedSignature = base64UrlEncode(signature);

  return `${signingInput}.${encodedSignature}`;
}

/**
 * Normalize signature to low-S form (BIP-62)
 */
function normalizeSigToLowS(sig: Uint8Array): Uint8Array {
  if (sig.length !== 64) {
    return sig;
  }

  const n = BigInt(
    '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141',
  );
  const halfN = n / 2n;

  const r = sig.slice(0, 32);
  const s = sig.slice(32, 64);
  const sHex = Buffer.from(s).toString('hex');
  let sBigInt = BigInt(`0x${sHex}`);

  if (sBigInt > halfN) {
    sBigInt = n - sBigInt;
    const sNormalized = sBigInt.toString(16).padStart(64, '0');
    const sMatches = sNormalized.match(/.{2}/gu) ?? [];
    const sBytes = new Uint8Array(sMatches.map((b) => parseInt(b, 16)));
    const normalized = new Uint8Array(64);
    normalized.set(r, 0);
    normalized.set(sBytes, 32);
    return normalized;
  }

  return sig;
}

/**
 * Parse DER-encoded ECDSA signature to raw format
 */
function parseDerSignature(der: Uint8Array): Uint8Array | null {
  try {
    if (der[0] !== 0x30) {
      return null;
    }

    let offset = 2;
    if (der[offset] !== 0x02) {
      return null;
    }
    offset += 1;
    const rLen = der[offset];
    offset += 1;
    let r = der.slice(offset, offset + rLen);
    offset += rLen;

    if (der[offset] !== 0x02) {
      return null;
    }
    offset += 1;
    const sLen = der[offset];
    offset += 1;
    let s = der.slice(offset, offset + sLen);

    if (r[0] === 0x00 && r.length > 32) {
      r = r.slice(1);
    }
    if (s[0] === 0x00 && s.length > 32) {
      s = s.slice(1);
    }

    const rPadded = new Uint8Array(32);
    const sPadded = new Uint8Array(32);
    rPadded.set(r, 32 - r.length);
    sPadded.set(s, 32 - s.length);

    const raw = new Uint8Array(64);
    raw.set(rPadded, 0);
    raw.set(sPadded, 32);
    return raw;
  } catch {
    return null;
  }
}

/**
 * Verify ECDSA signature (secp256k1/DKLS)
 */
export async function verifyEcdsaSignature(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  try {
    const msgHash = await crypto.subtle.digest(
      'SHA-256',
      message.buffer as ArrayBuffer,
    );
    const msgHashBytes = new Uint8Array(msgHash);

    let sig = signature;
    if (signature[0] === 0x30) {
      const rawSig = parseDerSignature(signature);
      if (rawSig) {
        sig = rawSig;
      }
    }

    let result = secp256k1.verify(sig, msgHashBytes, publicKey);

    if (!result && sig.length === 64) {
      const normalizedSig = normalizeSigToLowS(sig);
      result = secp256k1.verify(normalizedSig, msgHashBytes, publicKey);
    }

    if (!result) {
      try {
        const sigObj = secp256k1.Signature.fromCompact(sig);
        result = secp256k1.verify(sigObj, msgHashBytes, publicKey);
      } catch {
        // Signature parsing failed
      }
    }

    return result;
  } catch (error) {
    console.error('ECDSA verification error:', error);
    return false;
  }
}

/**
 * Verify Schnorr signature (ed25519/FROST)
 */
export async function verifySchnorrSignature(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  try {
    const pk = publicKey.length === 33 ? publicKey.slice(1) : publicKey;
    return await ed25519.verify(signature, message, pk);
  } catch (error) {
    console.error('Schnorr verification error:', error);
    return false;
  }
}

