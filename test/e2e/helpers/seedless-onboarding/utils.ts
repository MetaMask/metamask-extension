import { gcm } from '@noble/ciphers/aes';
import { managedNonce } from '@noble/ciphers/webcrypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { SecretType } from '@metamask/seedless-onboarding-controller';
import { bytesToBase64, stringToBytes } from '@metamask/utils';
import { decrypt } from '@toruslabs/eccrypto';
import { sign } from 'jsonwebtoken';
import { PasswordChangeItemId, SSSNodeKeyPairs } from './constants';
import {
  MockAuthPubKey,
  InitialMockEncryptionKey,
  MockJwtPrivateKey,
  MockKeyShareData,
  NewMockPwdEncryptionKeyAfterPasswordChange,
  PasswordSyncMockPwdEncryptionKey,
} from './data';
import { ToprfStoreKeyShareRequestParams } from './types';

/**
 * Generate a mock JWT token for OAuth Service.
 *
 * @param userId - The user ID.
 * @param expiresIn - The expiration time in seconds.
 * @param mode - Indicates if the token is a newly issued token or a refreshed token.
 * @returns The mock JWT token.
 */
export function generateMockJwtToken(
  userId: string,
  expiresIn: number = 120,
  mode: 'new' | 'refreshed' = 'new',
) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'torus-key-test',
    aud: 'torus-key-test',
    sub: userId,
    name: userId,
    email: userId,
    scope: 'email',
    iat,
    mode, // Note: The actual tokens issued/refreshed do not have this `mode` field, it's only used for testing purposes to differentiate between newly issued and refreshed tokens.
    eat: iat + expiresIn,
  };

  return sign(payload, MockJwtPrivateKey, {
    expiresIn,
    algorithm: 'ES256',
  });
}

export function padHex(hex: string, length: number = 64) {
  if (hex.length < length) {
    return hex.padStart(length, '0');
  }
  return hex;
}

export const TOPRF_EVAL_THRESHOLD = 3;

/**
 * Generate a mock blinded output for TOPRF Eval response.
 *
 * @param blindedInputX - The x coordinate of the blinded input from TOPRF Eval request.
 * @param blindedInputY - The y coordinate of the blinded input from TOPRF Eval request.
 * @param nodeIndex - The index of the node.
 * @param keyShareData - The key share data to use for the blinded output.
 * @param shareCoefficient - The share coefficient from TOPRF Eval request.
 * @returns The blinded output.
 */
export async function generateBlindedOutput(
  blindedInputX: string,
  blindedInputY: string,
  nodeIndex: number,
  keyShareData: ToprfStoreKeyShareRequestParams = MockKeyShareData,
  shareCoefficient: bigint = 1n,
) {
  const encShareString =
    keyShareData.share_import_items[nodeIndex - 1].encrypted_share;
  const nodePrivateKey = SSSNodeKeyPairs[nodeIndex].privKey;

  const { data, metadata } = JSON.parse(encShareString);

  const keyShare = await decrypt(Buffer.from(nodePrivateKey, 'hex'), {
    ciphertext: Buffer.from(data, 'hex'),
    iv: Buffer.from(metadata.iv, 'hex'),
    ephemPublicKey: Buffer.from(metadata.ephemPublicKey, 'hex'),
    mac: Buffer.from(metadata.mac, 'hex'),
  });
  const paddedShare = padHex(Buffer.from(keyShare).toString('hex'));
  const keyShareBN = BigInt(`0x${paddedShare}`);

  const ck = (keyShareBN * shareCoefficient) % secp256k1.CURVE.n;

  const blindedInputPoint = secp256k1.Point.fromAffine({
    x: BigInt(`0x${blindedInputX}`),
    y: BigInt(`0x${blindedInputY}`),
  });

  const blinedOutputPoint = blindedInputPoint.multiply(ck);
  const blindedOutputX = blinedOutputPoint.x.toString(16);
  const blindedOutputY = blinedOutputPoint.y.toString(16);

  return { blindedOutputX, blindedOutputY };
}

/**
 * Generate mock encrypted secret data for Metadata Service.
 *
 * @param secretDataArr - Array of secret data items.
 * @returns Parallel arrays matching the server response format (data, ids, versions, dataTypes, createdAt).
 */
export function generateEncryptedSecretData(
  secretDataArr: {
    data: Uint8Array;
    timestamp?: number;
    type?: SecretType;
    itemId?: string;
    dataType?: number | null;
    createdAt?: string | null;
    version?: string;
  }[],
): {
  data: string[];
  ids: string[];
  versions: string[];
  dataTypes: (number | null)[];
  createdAt: (string | null)[];
} {
  const data: string[] = [];
  const ids: string[] = [];
  const versions: string[] = [];
  const dataTypes: (number | null)[] = [];
  const createdAt: (string | null)[] = [];

  for (const secretData of secretDataArr) {
    const b64SecretData = Buffer.from(secretData.data).toString('base64');
    const secretMetadata = JSON.stringify({
      data: b64SecretData,
      timestamp: secretData.timestamp ?? 1752564090656,
      type: secretData.type,
    });

    const aes = managedNonce(gcm)(InitialMockEncryptionKey);
    const cipherText = aes.encrypt(stringToBytes(secretMetadata));

    data.push(bytesToBase64(cipherText));
    ids.push(secretData.itemId ?? '');
    versions.push(secretData.version ?? 'v2');
    dataTypes.push(secretData.dataType === undefined ? 1 : secretData.dataType); // Default to PrimarySrp if not specified
    createdAt.push(secretData.createdAt ?? null);
  }

  return { data, ids, versions, dataTypes, createdAt };
}

/**
 * Generate an encrypted password item that forces the max password-chain error.
 *
 * The PW_BACKUP is made self-referential (encKey points to itself) with a
 * non-matching authKeyPair.pk, causing the SDK's password chain loop to
 * exhaust and throw `maxKeyChainLengthExceeded`.
 *
 * @returns Encrypted password change item with metadata.
 */
export function generateEncryptedPasswordItemForMaxChainError(): {
  data: string;
  id: string;
  version: string;
  dataType: null;
  createdAt: null;
} {
  const pwdChangeItemData = utf8ToBytes(
    JSON.stringify({
      pw: 'newPassword',
      encKey: bytesToHex(NewMockPwdEncryptionKeyAfterPasswordChange),
      authKeyPair: { sk: '1', pk: 'deadbeef' },
    }),
  );

  const aes = managedNonce(gcm)(NewMockPwdEncryptionKeyAfterPasswordChange);
  const cipherText = aes.encrypt(pwdChangeItemData);

  return {
    data: bytesToBase64(cipherText),
    id: PasswordChangeItemId,
    version: 'v2',
    dataType: null,
    createdAt: null,
  };
}

/**
 * Generate a mock password change item for password-sync recovery.
 *
 * The item is encrypted with the latest password encryption key and contains
 * the previous device password encryption key and authentication public key.
 *
 * @returns Encrypted password change item with metadata.
 */
export function generateEncryptedPasswordSyncItem(): {
  data: string;
  id: string;
  version: string;
  dataType: null;
  createdAt: null;
} {
  const pwdChangeItemData = utf8ToBytes(
    JSON.stringify({
      pw: '',
      encKey: bytesToHex(NewMockPwdEncryptionKeyAfterPasswordChange),
      authKeyPair: { sk: '1', pk: MockAuthPubKey },
    }),
  );

  const aes = managedNonce(gcm)(PasswordSyncMockPwdEncryptionKey);
  const cipherText = aes.encrypt(pwdChangeItemData);

  return {
    data: bytesToBase64(cipherText),
    id: PasswordChangeItemId,
    version: 'v2',
    dataType: null,
    createdAt: null,
  };
}
