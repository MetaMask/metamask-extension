import type { ThresholdKey } from '@metamask/mfa-wallet-interface';
import type { StoredKeyShare, KeyType as MpcKeyType, PartyId } from '../types';

const STORAGE_KEY = 'mpc_key_share';

/**
 * Convert Uint8Array fields to arrays for JSON serialization
 *
 * @param key - The threshold key to convert
 * @returns A serializable record
 */
function keyToSerializable(key: ThresholdKey): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(key)) {
    if (v instanceof Uint8Array) {
      result[k] = Array.from(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// Fields that should be Uint8Array (not regular number arrays)
const UINT8_ARRAY_FIELDS = ['publicKey', 'share', 'privateKey', 'secretKey'];

/**
 * Restore Uint8Array fields from arrays
 *
 * @param obj - The serializable record to convert
 * @returns The threshold key
 */
function serializableToKey(obj: Record<string, unknown>): ThresholdKey {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    // Only convert known Uint8Array fields
    if (
      UINT8_ARRAY_FIELDS.includes(k) &&
      Array.isArray(v) &&
      v.every((x) => typeof x === 'number')
    ) {
      result[k] = new Uint8Array(v as number[]);
    } else {
      result[k] = v;
    }
  }
  return result as unknown as ThresholdKey;
}

/**
 * Serialize a ThresholdKey for localStorage storage
 *
 * @param key - The threshold key to serialize
 * @param keyType - The key type (secp256k1 or edwards25519)
 * @param partyId - The party ID
 * @param hasThreeParties - Whether the key has three parties
 * @param tssVerifierId - The TSS verifier ID for server lookup
 * @returns The serialized key share
 */
export function serializeKey(
  key: ThresholdKey,
  keyType: MpcKeyType,
  partyId: PartyId,
  hasThreeParties: boolean,
  tssVerifierId: string,
): StoredKeyShare {
  return {
    publicKey: key.publicKey ? Array.from(key.publicKey) : [],
    shareIndex: key.shareIndex ?? 0,
    custodians: key.custodians ?? [],
    threshold: key.threshold ?? 2,
    shareIndexes: key.shareIndexes ?? [],
    keyType,
    partyId,
    createdAt: new Date().toISOString(),
    hasThreeParties,
    keyJson: JSON.stringify(keyToSerializable(key)),
    tssVerifierId,
  };
}

/**
 * Convert a value to Uint8Array if it's array-like
 *
 * @param value - The value to convert
 * @returns Uint8Array or undefined
 */
function toUint8Array(value: unknown): Uint8Array | undefined {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }
  // Handle object format like {0: 1, 1: 2, ...}
  if (value && typeof value === 'object') {
    const arr = Object.values(value as Record<string, number>);
    if (arr.every((x) => typeof x === 'number')) {
      return new Uint8Array(arr);
    }
  }
  return undefined;
}

/**
 * Deserialize a stored key share back to ThresholdKey
 *
 * @param stored - The stored key share to deserialize
 * @returns The deserialized threshold key
 */
export function deserializeKey(stored: StoredKeyShare): ThresholdKey {
  let key: ThresholdKey;

  if (stored.keyJson) {
    key = serializableToKey(JSON.parse(stored.keyJson));
  } else {
    // Fallback for old format
    key = {
      publicKey: new Uint8Array(stored.publicKey),
      shareIndex: stored.shareIndex,
      custodians: stored.custodians,
      threshold: stored.threshold,
      shareIndexes: stored.shareIndexes,
    } as ThresholdKey;
  }

  // Ensure publicKey is definitely a Uint8Array
  if (key.publicKey && !(key.publicKey instanceof Uint8Array)) {
    key.publicKey = toUint8Array(key.publicKey) ?? new Uint8Array();
  }

  // Ensure share is definitely a Uint8Array if it exists
  const keyWithShare = key as ThresholdKey & { share?: unknown };
  if (keyWithShare.share && !(keyWithShare.share instanceof Uint8Array)) {
    keyWithShare.share = toUint8Array(keyWithShare.share);
  }

  return key;
}

/**
 * Save key share to localStorage
 *
 * @param key - The threshold key to save
 * @param keyType - The key type (secp256k1 or edwards25519)
 * @param partyId - The party ID
 * @param hasThreeParties - Whether the key has three parties
 * @param tssVerifierId - The TSS verifier ID for server lookup
 */
export function saveKeyShare(
  key: ThresholdKey,
  keyType: MpcKeyType,
  partyId: PartyId,
  hasThreeParties: boolean,
  tssVerifierId: string,
): void {
  const serialized = serializeKey(
    key,
    keyType,
    partyId,
    hasThreeParties,
    tssVerifierId,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

/**
 * Load key share from localStorage
 */
export function loadKeyShare(): StoredKeyShare | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as StoredKeyShare;
  } catch {
    return null;
  }
}

/**
 * Delete key share from localStorage
 */
export function deleteKeyShare(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a key share exists
 */
export function hasKeyShare(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
