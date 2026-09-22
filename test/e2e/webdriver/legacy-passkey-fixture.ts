import { createCipheriv, hkdfSync, randomBytes } from 'crypto';
import { decryptWithDetail } from '@metamask/browser-passworder';
import type { PasskeyRecord } from '@metamask/passkey-controller';
import { WALLET_PASSWORD } from '../constants';
import defaultFixture from '../fixtures/default-fixture.json';

/**
 * PKCS#8 DER for a test-only P-256 key. The virtual authenticator signs with
 * this key, and the fixture passkey record stores the matching COSE public key.
 */
const LEGACY_PASSKEY_PRIVATE_KEY_PKCS8 = Buffer.from(
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg386l9YeXHfxbciY5SarR-T_uWh9JbM7EkQl1g-yLRLOhRANCAAS9PGFetY3lD6ECmA66MNzeBfKxT_zA7lfnjvJYPFLoyPve2aIVvqZMv7wny95_1kFUNAudSMtlTA6Xuoga-NOj',
  'base64url',
);

/** COSE EC2 P-256 public key for {@link LEGACY_PASSKEY_PRIVATE_KEY_PKCS8}. */
const LEGACY_PASSKEY_COSE_PUBLIC_KEY =
  'pQECAyYgASFYIL08YV61jeUPoQKYDrow3N4F8rFP_MDuV-eO8lg8UujIIlgg-97ZohW-pky_vCfL3n_WQVQ0C51Iy2VMDpe6iBr406M';

/** Raw credential id. The passkey record stores its base64url form. */
export const LEGACY_PASSKEY_CREDENTIAL_ID = Uint8Array.from(
  Buffer.from('legacy-e2e-passkey', 'utf8'),
);

/** Raw userHandle used both to wrap the vault key and to satisfy assertions. */
export const LEGACY_PASSKEY_USER_HANDLE = new Uint8Array(64).fill(7);

const PASSKEY_HKDF_INFO = 'metamask:passkey:encryption-key:v1';

let legacyPasskeyRecordPromise: Promise<PasskeyRecord> | undefined;

/**
 * Wraps the default fixture vault key the same way PasskeyController wraps a
 * userHandle passkey, so unlock can decrypt it from a virtual-authenticator
 * assertion.
 *
 * @returns Passkey record for `withPasskeyController`.
 */
export function getLegacyUserHandlePasskeyRecord(): Promise<PasskeyRecord> {
  legacyPasskeyRecordPromise ??= createLegacyUserHandlePasskeyRecord();
  return legacyPasskeyRecordPromise;
}

/**
 * PKCS#8 private key bytes to preload into the virtual authenticator.
 *
 * @returns DER-encoded P-256 private key.
 */
export function getLegacyPasskeyPrivateKey(): Uint8Array {
  return LEGACY_PASSKEY_PRIVATE_KEY_PKCS8;
}

async function createLegacyUserHandlePasskeyRecord(): Promise<PasskeyRecord> {
  const { data } = defaultFixture as {
    data: Record<string, { vault: string }>;
  };
  const { vault } = data.KeyringController;
  const { exportedKeyString } = await decryptWithDetail(WALLET_PASSWORD, vault);
  const wrappingKey = Buffer.from(
    hkdfSync(
      'sha256',
      LEGACY_PASSKEY_USER_HANDLE,
      LEGACY_PASSKEY_CREDENTIAL_ID,
      PASSKEY_HKDF_INFO,
      32,
    ),
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', wrappingKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(exportedKeyString, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return {
    credential: {
      id: Buffer.from(LEGACY_PASSKEY_CREDENTIAL_ID).toString('base64url'),
      publicKey: LEGACY_PASSKEY_COSE_PUBLIC_KEY,
      counter: 0,
      transports: ['internal'],
      aaguid: '00000000-0000-0000-0000-000000000000',
    },
    encryptedVaultKey: {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
    },
    keyDerivation: { method: 'userHandle' },
  };
}
